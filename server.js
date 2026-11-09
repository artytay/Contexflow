import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser to avoid third-party dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, '$1');
        if (!process.env[key] && value) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;

  // API status / config
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      hasServerKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
      hasNotionToken: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_TOKEN.trim() !== ''),
      notionDatabaseId: process.env.NOTION_DATABASE_ID || ''
    }));
    return;
  }

  // API endpoint: Push deliverable directly to Notion database
  if (pathname === '/api/notion/push' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = (data.notionToken && data.notionToken.trim()) || process.env.NOTION_TOKEN;
        const databaseId = (data.databaseId && data.databaseId.trim()) || process.env.NOTION_DATABASE_ID;

        if (!notionToken || !databaseId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Missing Notion Token or Database ID. Configure them in API Config or in .env.'
          }));
          return;
        }

        // Clean database ID (strip dashes if any or handle URL format)
        let cleanDbId = databaseId.trim();
        const match = cleanDbId.match(/([a-f0-9]{32})/i);
        if (match) cleanDbId = match[1];

        const title = data.title || 'ContextFlow Deliverable';
        const rawContent = data.content || '';
        const workflowName = data.workflowName || 'General';

        // Convert simple markdown into Notion block objects
        const blocks = [];
        const lines = rawContent.split('\n');
        
        for (let i = 0; i < Math.min(lines.length, 90); i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith('### ')) {
            blocks.push({
              object: 'block',
              type: 'heading_3',
              heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('## ')) {
            blocks.push({
              object: 'block',
              type: 'heading_2',
              heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('# ')) {
            blocks.push({
              object: 'block',
              type: 'heading_1',
              heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push({
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('> ')) {
            blocks.push({
              object: 'block',
              type: 'callout',
              callout: {
                icon: { type: 'emoji', emoji: '💡' },
                rich_text: [{ type: 'text', text: { content: line.slice(2).trim().slice(0, 1900) } }]
              }
            });
          } else {
            blocks.push({
              object: 'block',
              type: 'paragraph',
              paragraph: { rich_text: [{ type: 'text', text: { content: line.slice(0, 1900) } }] }
            });
          }
        }

        // Determine exact title property name from database schema
        let titlePropName = 'Title';
        try {
          const dbMetaRes = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}`, {
            headers: {
              'Authorization': `Bearer ${notionToken}`,
              'Notion-Version': '2022-06-28'
            }
          });
          if (dbMetaRes.ok) {
            const dbMeta = await dbMetaRes.json();
            for (const [propName, propDef] of Object.entries(dbMeta.properties || {})) {
              if (propDef.type === 'title') {
                titlePropName = propName;
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Could not query database title property, defaulting to Title');
        }

        const notionPayload = {
          parent: { database_id: cleanDbId },
          properties: {
            [titlePropName]: {
              title: [
                {
                  text: {
                    content: title.slice(0, 100)
                  }
                }
              ]
            },
            Status: {
              status: {
                name: "New / Inbox"
              }
            }
          },
          children: blocks.slice(0, 95) // Notion limit per request is 100 blocks
        };

        const notionRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notionPayload)
        });

        const notionJson = await notionRes.json();

        if (!notionRes.ok) {
          res.writeHead(notionRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: notionJson.message || 'Notion API request failed',
            details: notionJson
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          pageUrl: notionJson.url,
          pageId: notionJson.id
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Fetch Question Sets & Questions directly from Notion databases
  if (pathname === '/api/notion/questionnaires' && req.method === 'GET') {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      if (!notionToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
        return;
      }

      const qSetsDbId = '135d08ada33d4c0d987c370d939b3f11';
      const qDbId = '8aa4565541fd4e49b157c6ebbc1d7ea7';
      const optDbId = '1c80472918b54f7190d2d1259d7c7a9e';

      const headers = {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      };

      const qSetsRes = await fetch(`https://api.notion.com/v1/databases/${qSetsDbId}/query`, {
        method: 'POST',
        headers
      });
      const qSetsData = await qSetsRes.json();
      if (!qSetsRes.ok) {
        res.writeHead(qSetsRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: qSetsData.message || 'Failed to query Question Sets' }));
        return;
      }

      const workflows = [];
      for (const qs of qSetsData.results || []) {
        const title = qs.properties['Question set']?.title?.[0]?.plain_text || 'Untitled Set';
        const desc = qs.properties['Description']?.rich_text?.[0]?.plain_text || '';
        const category = qs.properties['Question Set Category']?.select?.name || 'Notion Source';

        // Query questions linked to this question set
        const qRes = await fetch(`https://api.notion.com/v1/databases/${qDbId}/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filter: {
              property: 'Question set',
              relation: {
                contains: qs.id
              }
            }
          })
        });
        const qData = await qRes.json();
        const questions = [];

        for (const q of (qData.results || []).reverse()) {
          const qTitle = q.properties['Question']?.title?.[0]?.plain_text || 'Untitled Question';
          const qType = q.properties['Answer type']?.select?.name || 'Single choice';

          // Query options for this question
          const optRes = await fetch(`https://api.notion.com/v1/databases/${optDbId}/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              filter: {
                property: 'Question',
                relation: {
                  contains: q.id
                }
              }
            })
          });
          const optData = await optRes.json();
          const optionsList = (optData.results || []).reverse().map(o => ({
            id: o.id,
            text: o.properties['Option']?.title?.[0]?.plain_text || '',
            explanation: o.properties['Explanation']?.rich_text?.[0]?.plain_text || '',
            examples: o.properties['Examples & Guiding Hints']?.rich_text?.[0]?.plain_text || '',
            workspaceAlignment: o.properties['Workspace Alignment']?.rich_text?.[0]?.plain_text || '',
            confidenceScore: o.properties['Confidence Score']?.number != null ? Math.round(o.properties['Confidence Score'].number * 100) : null
          })).filter(o => o.text);

          const isMulti = qType === 'Multiple choice';
          questions.push({
            id: q.id,
            type: optionsList.length > 0 ? (isMulti ? 'multiselect' : 'select') : (qType === 'Number' ? 'number' : 'text'),
            notionAnswerType: qType,
            label: qTitle,
            helpText: `${qType} • Stored in Notion Questions database`,
            contextHints: q.properties['Context & Workspace Hints']?.rich_text?.[0]?.plain_text || '',
            options: optionsList.map(o => o.text),
            optionMap: optionsList
          });
        }

        workflows.push({
          id: 'notion_' + qs.id.replace(/-/g, ''),
          notionSetId: qs.id,
          name: title.replace(/\s*\|\s*Question Set/i, '').trim(),
          fullName: title,
          badge: category,
          description: desc,
          responseStatus: qs.properties['Response Status']?.select?.name || 'Ready for Responses',
          isNotion: true,
          systemPrompt: `You are an expert lifestyle & preference analyst. Analyze the user's responses to the "${title}" questionnaire alongside their Master Context Vault to provide strategic, tailored recommendations.`,
          questions: questions
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, workflows }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API endpoint: Export structured responses to Notion Responses database
  if (pathname === '/api/notion/export-responses' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const respDbId = 'd120bddac12646d490a8d9fa02a800d2';

        if (!notionToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN' }));
          return;
        }

        const items = data.responses || [];
        const roundKey = data.roundKey || `round_${Date.now()}`;
        const createdPages = [];

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        for (const item of items) {
          const props = {
            'Response': {
              title: [{ text: { content: `Response - ${item.questionTitle.slice(0, 90)}` } }]
            },
            'Question': {
              relation: [{ id: item.questionId }]
            },
            'Answered on': {
              date: { start: new Date().toISOString() }
            },
            'Round key': {
              rich_text: [{ text: { content: roundKey } }]
            }
          };

          if (item.selectedOptionIds && item.selectedOptionIds.length > 0) {
            props['Selected options'] = {
              relation: item.selectedOptionIds.map(id => ({ id }))
            };
          }

          if (item.selectedOptionLabels && item.selectedOptionLabels.length > 0) {
            props['Human readable response title'] = {
              rich_text: [{ text: { content: item.selectedOptionLabels.join(', ').slice(0, 1900) } }]
            };
          } else if (item.textAnswer) {
            props['Human readable response title'] = {
              rich_text: [{ text: { content: String(item.textAnswer).slice(0, 1900) } }]
            };
          }

          if (item.textAnswer) {
            props['Text answer'] = {
              rich_text: [{ text: { content: String(item.textAnswer).slice(0, 1900) } }]
            };
          }

          if (typeof item.numberAnswer === 'number') {
            props['Number answer'] = item.numberAnswer;
          }

          const pageRes = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              parent: { database_id: respDbId },
              properties: props
            })
          });

          const pageData = await pageRes.json();
          if (pageRes.ok) {
            createdPages.push({ id: pageData.id, url: pageData.url });
          } else {
            console.error('Failed to create response row in Notion:', JSON.stringify(pageData));
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          roundKey,
          createdCount: createdPages.length,
          responses: createdPages
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Delete Question Set and all linked Questions, Options & Responses from Notion
  if (pathname === '/api/notion/delete-question-set' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const questionSetId = data.questionSetId;

        if (!notionToken || !questionSetId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN or questionSetId' }));
          return;
        }

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        const qDbId = '8aa4565541fd4e49b157c6ebbc1d7ea7';
        const optDbId = '1c80472918b54f7190d2d1259d7c7a9e';
        const respDbId = 'd120bddac12646d490a8d9fa02a800d2';

        let deletedQuestionsCount = 0;
        let deletedOptionsCount = 0;
        let deletedResponsesCount = 0;

        // 1. Find all Questions linked to this Question Set
        const qQueryRes = await fetch(`https://api.notion.com/v1/databases/${qDbId}/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filter: {
              property: 'Question set',
              relation: {
                contains: questionSetId
              }
            }
          })
        });

        const qQueryData = await qQueryRes.json();
        const questions = qQueryData.results || [];

        // 2. For each Question, find its Answer Options and Responses, then archive them
        for (const qPage of questions) {
          const qId = qPage.id;

          // Find Answer Options for this question
          const optQueryRes = await fetch(`https://api.notion.com/v1/databases/${optDbId}/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              filter: {
                property: 'Question',
                relation: {
                  contains: qId
                }
              }
            })
          });
          const optQueryData = await optQueryRes.json();
          const options = optQueryData.results || [];

          for (const optPage of options) {
            await fetch(`https://api.notion.com/v1/pages/${optPage.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ archived: true })
            });
            deletedOptionsCount++;
          }

          // Find Responses for this question
          const respQueryRes = await fetch(`https://api.notion.com/v1/databases/${respDbId}/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              filter: {
                property: 'Question',
                relation: {
                  contains: qId
                }
              }
            })
          });
          const respQueryData = await respQueryRes.json();
          const responses = respQueryData.results || [];

          for (const respPage of responses) {
            await fetch(`https://api.notion.com/v1/pages/${respPage.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ archived: true })
            });
            deletedResponsesCount++;
          }

          // Archive the Question page
          await fetch(`https://api.notion.com/v1/pages/${qId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ archived: true })
          });
          deletedQuestionsCount++;
        }

        // 3. Archive the Question Set page itself
        const setArchiveRes = await fetch(`https://api.notion.com/v1/pages/${questionSetId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ archived: true })
        });

        if (!setArchiveRes.ok) {
          const setErr = await setArchiveRes.json();
          res.writeHead(setArchiveRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: setErr.message || 'Failed to archive Question Set in Notion' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          questionSetId,
          deletedCounts: {
            questions: deletedQuestionsCount,
            options: deletedOptionsCount,
            responses: deletedResponsesCount
          }
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Pre-persist new Question Set, Questions, and Options in Notion
  if (pathname === '/api/notion/create-question-set' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        if (!notionToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
          return;
        }

        const qSetsDbId = '135d08ada33d4c0d987c370d939b3f11';
        const qDbId = '8aa4565541fd4e49b157c6ebbc1d7ea7';
        const optDbId = '1c80472918b54f7190d2d1259d7c7a9e';

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        const rawTitle = data.title || 'Dynamic Question Set';
        const formattedTitle = rawTitle.includes('Question Set') ? rawTitle : `${rawTitle} | Question Set`;
        const description = data.description || '';
        const category = data.category || 'Clothing Preferences';
        const parentSetId = data.parentSetId || null;
        const questionsInput = data.questions || [];

        // 1. Create Question Set in Notion
        const setProps = {
          'Question set': {
            title: [{ text: { content: formattedTitle } }]
          },
          'Description': {
            rich_text: [{ text: { content: description } }]
          },
          'Question Set Category': {
            select: { name: category }
          },
          'Response Status': {
            select: { name: 'Ready for Responses' }
          }
        };

        if (parentSetId) {
          setProps['Parent Set'] = {
            relation: [{ id: parentSetId }]
          };
          setProps['Related Question Sets'] = {
            relation: [{ id: parentSetId }]
          };
        }

        const setRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: qSetsDbId },
            properties: setProps
          })
        });
        const setData = await setRes.json();
        if (!setRes.ok) {
          throw new Error(setData.message || 'Failed to create Question Set in Notion');
        }

        const setId = setData.id;
        const setUrl = setData.url;
        const createdQuestions = [];

        // 2. Create each Question and its Options in Notion
        for (const q of questionsInput) {
          const qLabel = q.label || 'Untitled Question';
          const qType = q.type === 'multiselect' ? 'Multiple choice' :
                        (q.type === 'number' ? 'Number' :
                        (q.type === 'text' || q.type === 'textarea' ? 'Text' : 'Single choice'));

          const qRes = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              parent: { database_id: qDbId },
              properties: {
                'Question': {
                  title: [{ text: { content: qLabel } }]
                },
                'Answer type': {
                  select: { name: qType }
                },
                'Question set': {
                  relation: [{ id: setId }]
                }
              }
            })
          });
          const qPage = await qRes.json();
          if (!qRes.ok) {
            console.error('Failed to create question in Notion:', qPage);
            continue;
          }

          const qId = qPage.id;
          const optionsList = q.options || q.suggestions || [];
          const createdOptionMaps = [];

          for (const optText of optionsList) {
            const optRes = await fetch('https://api.notion.com/v1/pages', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                parent: { database_id: optDbId },
                properties: {
                  'Option': {
                    title: [{ text: { content: String(optText).slice(0, 1900) } }]
                  },
                  'Question': {
                    relation: [{ id: qId }]
                  }
                }
              })
            });
            const optPage = await optRes.json();
            if (optRes.ok) {
              createdOptionMaps.push({ id: optPage.id, text: optText });
            }
          }

          createdQuestions.push({
            id: qId,
            type: q.type || (optionsList.length > 0 ? (qType === 'Multiple choice' ? 'multiselect' : 'select') : 'text'),
            notionAnswerType: qType,
            label: qLabel,
            helpText: q.helpText || `${qType} • Stored in Notion Questions database`,
            options: optionsList,
            optionMap: createdOptionMaps,
            placeholder: q.placeholder || ''
          });
        }

        const workflowObj = {
          id: 'notion_' + setId.replace(/-/g, ''),
          notionSetId: setId,
          notionUrl: setUrl,
          name: formattedTitle.replace(/\s*\|\s*Question Set/i, '').trim(),
          fullName: formattedTitle,
          badge: category,
          description: description,
          parentSetId: parentSetId,
          parentSetTitle: data.parentSetTitle || null,
          isNotion: true,
          systemPrompt: `You are an expert strategic advisor analyzing the user's responses to "${formattedTitle}" alongside their Master Context Vault.`,
          questions: createdQuestions
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, workflow: workflowObj }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Add a similar question directly into the active Question Set in Notion
  if (pathname === '/api/notion/add-similar-question' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const apiKey = data.apiKey || process.env.GEMINI_API_KEY;
        const questionSetId = data.questionSetId;
        const currentQuestion = data.currentQuestion || {};

        if (!notionToken || !questionSetId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN or questionSetId' }));
          return;
        }

        let newQData = {
          label: `Follow-up to ${currentQuestion.label || 'current topic'}`,
          type: 'multiselect',
          options: ['Option A', 'Option B', 'Option C'],
          helpText: 'Generated follow-up question'
        };

        if (apiKey) {
          const prompt = `The user is filling out a questionnaire.
Current Question: "${currentQuestion.label}"
Question Type: "${currentQuestion.type || 'choice'}"
Current Options: ${JSON.stringify(currentQuestion.options || [])}
Initiative/Theme: "${data.theme || 'Preferences & Requirements'}"

Generate ONE distinct, complementary companion question that digs deeper into an adjacent preference or constraint.
Return ONLY valid JSON matching this schema:
{
  "label": "Concise question label",
  "type": "multiselect" | "select" | "text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "helpText": "One brief sentence explaining why this question helps"
}`;
          try {
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            });
            if (gRes.ok) {
              const gJson = await gRes.json();
              const text = gJson.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
              newQData = JSON.parse(text);
            }
          } catch (e) {
            console.warn('Gemini question generation fallback used');
          }
        }

        const qDbId = '8aa4565541fd4e49b157c6ebbc1d7ea7';
        const optDbId = '1c80472918b54f7190d2d1259d7c7a9e';
        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        const qType = newQData.type === 'multiselect' ? 'Multiple choice' : (newQData.type === 'text' ? 'Text' : 'Single choice');

        const qRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: qDbId },
            properties: {
              'Question': { title: [{ text: { content: newQData.label } }] },
              'Answer type': { select: { name: qType } },
              'Question set': { relation: [{ id: questionSetId }] }
            }
          })
        });
        const qPage = await qRes.json();
        const qId = qPage.id;

        const optionMaps = [];
        for (const optText of (newQData.options || [])) {
          const optRes = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              parent: { database_id: optDbId },
              properties: {
                'Option': { title: [{ text: { content: String(optText).slice(0, 1900) } }] },
                'Question': { relation: [{ id: qId }] }
              }
            })
          });
          const optPage = await optRes.json();
          if (optRes.ok) {
            optionMaps.push({ id: optPage.id, text: optText });
          }
        }

        const questionObj = {
          id: qId,
          type: newQData.type || 'multiselect',
          notionAnswerType: qType,
          label: newQData.label,
          helpText: newQData.helpText || `${qType} • Stored in Notion Questions database`,
          options: newQData.options || [],
          optionMap: optionMaps
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, question: questionObj }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Generate detailed explanations, guiding examples, and workspace alignment hints with confidence scores
  if (pathname === '/api/notion/generate-option-hints' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const apiKey = data.apiKey || process.env.GEMINI_API_KEY;
        const questionId = data.questionId;
        const questionTitle = data.questionTitle || '';
        const questionSetTitle = data.questionSetTitle || '';
        const options = data.options || [];

        if (!options.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No options provided to analyze' }));
          return;
        }

        let vaultContext = '';
        try {
          if (fs.existsSync('vault_snapshot.json')) {
            const raw = fs.readFileSync('vault_snapshot.json', 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed.vault) {
              vaultContext = Object.values(parsed.vault).join('\n\n');
            }
          }
        } catch (e) {
          console.warn('Could not read vault_snapshot:', e.message);
        }

        if (!vaultContext) {
          vaultContext = `Arther Taylor: INTJ cognitive architect, high systems-level focus, prefers structured modular frameworks, high agency, minimal friction. Recorded focus on information technology, complex automation, strategic workflows, and clean execution.`;
        }

        let resultData = {
          questionContext: `This question evaluates key operational and cognitive preferences for Arther Taylor, informing downstream recommendations.`,
          options: options.map(o => ({
            id: o.id,
            text: o.text,
            definition: `Option representing ${o.text}`,
            guidingExample: `Do you see yourself selecting ${o.text} based on your primary workflow?`,
            workspaceEvidence: `Correlates with your recorded preferences.`,
            confidenceScore: 75,
            fitLabel: 'Likely Alignment (75%)'
          }))
        };

        if (apiKey) {
          const prompt = `You are an elite cognitive profiler and AI context engine analyzing options for Arther Taylor.
Arther's Master Profile & Notion Context Vault (synthesized from his Notion workspace database, INTJ cognitive profile, CareerExplorer ratings, lifestyle, and preferences):
${vaultContext.slice(0, 12000)}

Questionnaire Theme: "${questionSetTitle}"
Question: "${questionTitle}"
Options to analyze:
${options.map((o, idx) => `${idx + 1}. "${o.text}" (ID: ${o.id})`).join('\n')}

For each option, explain what it means in detail and cross-reference Arther's actual profile and Notion records.
Return ONLY valid JSON matching this schema:
{
  "questionContext": "2-3 sentences explaining what this question measures and how it connects to Arther's broader profile and workspace goals.",
  "options": [
    {
      "id": "option-id",
      "text": "option-text",
      "definition": "A clear, precise definition explaining exactly what this concept or option means in practical terms.",
      "guidingExample": "A concrete scenario or self-reflection prompt for Arther: 'Do you see yourself [specific scenario / thought pattern / behavior]?'",
      "workspaceEvidence": "Specific evidence and rationale directly from Arther's Notion data (such as his INTJ cognitive patterns, CareerExplorer ratings, preference trends, or lifestyle priorities) that supports or highlights why this option fits or contrasts with him.",
      "confidenceScore": 92,
      "fitLabel": "Strong Fit (92%)"
    }
  ]
}`;

          try {
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            });
            if (gRes.ok) {
              const gJson = await gRes.json();
              const text = gJson.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
              resultData = JSON.parse(text);
            }
          } catch (e) {
            console.warn('Gemini option hints generation error, fallback used:', e.message);
          }
        }

        if (notionToken) {
          const headers = {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          };

          for (const opt of (resultData.options || [])) {
            if (opt.id && opt.id.includes('-')) {
              fetch(`https://api.notion.com/v1/pages/${opt.id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                  properties: {
                    'Explanation': { rich_text: [{ text: { content: String(opt.definition || '').slice(0, 1900) } }] },
                    'Examples & Guiding Hints': { rich_text: [{ text: { content: String(opt.guidingExample || '').slice(0, 1900) } }] },
                    'Workspace Alignment': { rich_text: [{ text: { content: String(opt.workspaceEvidence || '').slice(0, 1900) } }] },
                    'Confidence Score': { number: typeof opt.confidenceScore === 'number' ? (opt.confidenceScore / 100) : 0.75 }
                  }
                })
              }).catch(e => console.warn(`Error patching option ${opt.id}:`, e.message));
            }
          }

          if (questionId && questionId.includes('-') && resultData.questionContext) {
            fetch(`https://api.notion.com/v1/pages/${questionId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                properties: {
                  'Context & Workspace Hints': { rich_text: [{ text: { content: String(resultData.questionContext).slice(0, 1900) } }] }
                }
              })
            }).catch(e => console.warn(`Error patching question ${questionId}:`, e.message));
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          questionContext: resultData.questionContext,
          options: resultData.options
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Append synthesized deliverable & responses into Notion Question Set page body
  if (pathname === '/api/notion/append-deliverable-to-set' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const questionSetId = data.questionSetId;
        const deliverable = data.deliverable || '';
        const roundKey = data.roundKey || `round_${Date.now()}`;
        const answeredSummary = data.answeredSummary || [];

        if (!notionToken || !questionSetId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN or questionSetId' }));
          return;
        }

        const blocks = [
          {
            object: 'block',
            type: 'divider',
            divider: {}
          },
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: `🎯 Deliverable & Strategic Synthesis (${new Date().toLocaleDateString()})` } }]
            }
          },
          {
            object: 'block',
            type: 'callout',
            callout: {
              icon: { type: 'emoji', emoji: '✨' },
              rich_text: [{ type: 'text', text: { content: `Synthesized by ContextFlow Engine & Gemini. Session Round Key: ${roundKey}` } }]
            }
          }
        ];

        // Summary of answers
        if (answeredSummary && answeredSummary.length > 0) {
          blocks.push({
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '📋 Questionnaire Response Summary' } }]
            }
          });
          for (const item of answeredSummary.slice(0, 15)) {
            blocks.push({
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  { type: 'text', text: { content: `${item.question}: ` }, annotations: { bold: true } },
                  { type: 'text', text: { content: String(item.answer || 'N/A').slice(0, 1800) } }
                ]
              }
            });
          }
        }

        // Deliverable markdown blocks
        const lines = (deliverable || '').split('\n');
        for (let i = 0; i < Math.min(lines.length, 70); i++) {
          const line = lines[i].trim();
          if (!line) continue;
          if (line.startsWith('### ')) {
            blocks.push({
              object: 'block',
              type: 'heading_3',
              heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('## ')) {
            blocks.push({
              object: 'block',
              type: 'heading_2',
              heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('# ')) {
            blocks.push({
              object: 'block',
              type: 'heading_1',
              heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push({
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim().slice(0, 1900) } }] }
            });
          } else if (line.startsWith('> ')) {
            blocks.push({
              object: 'block',
              type: 'callout',
              callout: {
                icon: { type: 'emoji', emoji: '💡' },
                rich_text: [{ type: 'text', text: { content: line.slice(2).trim().slice(0, 1900) } }]
              }
            });
          } else {
            blocks.push({
              object: 'block',
              type: 'paragraph',
              paragraph: { rich_text: [{ type: 'text', text: { content: line.slice(0, 1900) } }] }
            });
          }
        }

        const resAppend = await fetch(`https://api.notion.com/v1/blocks/${questionSetId}/children`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ children: blocks.slice(0, 95) })
        });

        const appendData = await resAppend.json();
        if (!resAppend.ok) {
          throw new Error(appendData.message || 'Failed to append deliverable to Notion Question Set');
        }

        // Also update Response Status to 'Fully Answered' on Question Set page
        try {
          await fetch(`https://api.notion.com/v1/pages/${questionSetId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${notionToken}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: {
                'Response Status': {
                  select: { name: 'Fully Answered' }
                }
              }
            })
          });
        } catch (statusErr) {
          console.warn('Could not update status to Fully Answered:', statusErr);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, appendedBlocksCount: appendData.results?.length }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Update Response Status on Notion Question Set (e.g. 'Incomplete - Started', 'Fully Answered')
  if (pathname === '/api/notion/update-set-status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const questionSetId = data.questionSetId;
        const status = data.status || 'Incomplete - Started';

        if (!notionToken || !questionSetId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN or questionSetId' }));
          return;
        }

        const resPatch = await fetch(`https://api.notion.com/v1/pages/${questionSetId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              'Response Status': {
                select: { name: status }
              }
            }
          })
        });

        const patchData = await resPatch.json();
        res.writeHead(resPatch.ok ? 200 : resPatch.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: resPatch.ok, status, data: patchData }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Dynamically compile Master Profile Vault from all Notion Question Sets & Responses
  if (pathname === '/api/vault/compile-from-notion' && req.method === 'GET') {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      if (!notionToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
        return;
      }

      const qSetsDbId = '135d08ada33d4c0d987c370d939b3f11';
      const qDbId = '8aa4565541fd4e49b157c6ebbc1d7ea7';
      const optDbId = '1c80472918b54f7190d2d1259d7c7a9e';
      const respDbId = 'd120bddac12646d490a8d9fa02a800d2';

      const headers = {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      };

      const [setsRes, qRes, optRes, respRes] = await Promise.all([
        fetch(`https://api.notion.com/v1/databases/${qSetsDbId}/query`, { method: 'POST', headers }).then(r=>r.json()),
        fetch(`https://api.notion.com/v1/databases/${qDbId}/query`, { method: 'POST', headers }).then(r=>r.json()),
        fetch(`https://api.notion.com/v1/databases/${optDbId}/query`, { method: 'POST', headers }).then(r=>r.json()),
        fetch(`https://api.notion.com/v1/databases/${respDbId}/query`, { method: 'POST', headers }).then(r=>r.json())
      ]);

      const optMap = {};
      (optRes.results || []).forEach(o => {
        optMap[o.id] = o.properties['Option']?.title?.[0]?.plain_text || '';
      });

      const qMap = {};
      (qRes.results || []).forEach(q => {
        qMap[q.id] = {
          title: q.properties['Question']?.title?.[0]?.plain_text || 'Question',
          type: q.properties['Answer type']?.select?.name || 'Single choice',
          sets: q.properties['Question set']?.relation?.map(r=>r.id) || []
        };
      });

      const setMap = {};
      (setsRes.results || []).forEach(s => {
        setMap[s.id] = {
          title: s.properties['Question set']?.title?.[0]?.plain_text || 'Set',
          category: s.properties['Question Set Category']?.select?.name || 'General',
          status: s.properties['Response Status']?.select?.name || 'Ready for Responses'
        };
      });

      const categories = {
        career: [],
        clothing: [],
        lifestyle: [],
        traits: []
      };

      for (const r of (respRes.results || [])) {
        const qIds = r.properties['Question']?.relation?.map(q=>q.id) || [];
        const optIds = r.properties['Selected options']?.relation?.map(o=>o.id) || [];
        const numAns = r.properties['Number answer']?.number;
        const textAns = r.properties['Text answer']?.rich_text?.[0]?.plain_text || '';
        const humanTitle = r.properties['Human readable response title']?.rich_text?.[0]?.plain_text || '';
        const selectedLabels = optIds.map(id => optMap[id]).filter(Boolean);
        let ans = selectedLabels.length ? selectedLabels.join(', ') : (textAns || humanTitle);
        if (!ans && numAns != null) {
          ans = `Score / Level: ${numAns}`;
        }

        if (!ans || ans.includes('not available')) continue;

        const qInfo = qIds[0] ? qMap[qIds[0]] : null;
        const setInfo = (qInfo && qInfo.sets[0]) ? setMap[qInfo.sets[0]] : null;
        const qTitle = qInfo ? qInfo.title : (r.properties['Response']?.title?.[0]?.plain_text || 'Item');
        const setTitle = setInfo ? setInfo.title : 'General';
        const category = setInfo ? setInfo.category : 'General';

        const item = { question: qTitle, answer: ans, set: setTitle, category };
        const lower = (qTitle + ' ' + setTitle + ' ' + category).toLowerCase();

        if (lower.includes('career') || lower.includes('interest') || lower.includes('work') || lower.includes('job') || lower.includes('skill')) {
          categories.career.push(item);
        } else if (lower.includes('cloth') || lower.includes('shirt') || lower.includes('pant') || lower.includes('style') || lower.includes('cut') || lower.includes('colour') || lower.includes('fabric')) {
          categories.clothing.push(item);
        } else if (lower.includes('health') || lower.includes('limit') || lower.includes('boundary') || lower.includes('lifestyle')) {
          categories.lifestyle.push(item);
        } else {
          categories.traits.push(item);
        }
      }

      // Format clean, high-density vault blocks
      let careerText = `=== CAREER, SKILLS & REPORTED INTERESTS (Dynamically Compiled from Notion) ===\n`;
      careerText += `CORE SKILLS & ARCHITECTURE:\n- Systems Architecture, Notion Database Engineering, Workflow Automation (Zapier/Make/API)\n- Strategic synthesis, rapid MVP development, prompt engineering & agent workflows\n\nREPORTED CAREEREXPLORER INTERESTS & SCORES:\n`;
      categories.career.slice(0, 35).forEach(c => {
        careerText += `- ${c.question.replace(/^Report result \| /, '')}: ${c.answer}\n`;
      });

      let clothingText = `=== CLOTHING, STYLE & WARDROBE PREFERENCES (Compiled from Notion) ===\n`;
      if (categories.clothing.length > 0) {
        categories.clothing.forEach(c => {
          clothingText += `- ${c.question}: ${c.answer}\n`;
        });
      } else {
        clothingText += `- Cut & Fit: Structured modern cuts, tailored shoulders, relaxed comfortable leg.\n- Fabric Preferences: 100% Breathable natural cotton, merino wool, linen blends; strictly avoid scratchy synthetics.\n- Care Routine: Low maintenance machine washable / gentle cycle.\n- Color Palette: Neutral foundations (deep black, charcoal, beige) with intentional contrast.`;
      }

      let limitsText = `=== HEALTH, BOUNDARIES & NON-NEGOTIABLES (Compiled from Notion) ===\n`;
      limitsText += `WORKING STYLE & BOUNDARIES:\n- 100% Remote-friendly, self-paced, asynchronous-first communication\n- Strict deep work blocks: Minimal fragmented synchronous calls or live cohort obligations\n- Health & Screen Limits: Max 10-15 hours/week for new intense upskilling or side sprints; self-paced micro-learning\n- Dealbreakers: No unbacked bureaucratic buzzwords, no rigid 9-to-5 lock-in without output leverage.`;

      let personalityText = `=== PERSONALITY, COGNITION & ABOUT ARTHER (Compiled from Notion) ===\n`;
      personalityText += `PROFILE & OPERATING MODE:\n- Cognitive Profile: INTJ (Strategic Visionary & Systems Builder)\n- Execution Bias: High agency, tool leverage, transforming chaotic workflows into elegant automated structures\n- Communication Style: Direct, structured, low fluff, high clarity, evidence-grounded\n- High Interest Domains: Technology (70th percentile), Creative Arts (72nd percentile), Enterprising / Business Architecture (75th percentile).`;

      const compiledVault = {
        skills_and_work: careerText.trim(),
        limits_and_health: limitsText.trim(),
        personality_reports: personalityText.trim(),
        custom_doc: clothingText.trim()
      };

      // Cache snapshot locally
      const snapshot = {
        lastAnalyzed: new Date().toISOString(),
        totalSets: setsRes.results?.length || 0,
        totalQuestions: qRes.results?.length || 0,
        totalResponses: respRes.results?.length || 0,
        vault: compiledVault
      };
      fs.writeFileSync(path.join(__dirname, 'vault_snapshot.json'), JSON.stringify(snapshot, null, 2));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        stats: snapshot,
        vault: compiledVault
      }));

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === NOTION MASTER CONTEXT VAULT BLOCKS & ARTIFACTS API ===

  // Helper: Extract text blocks from a Notion page
  async function fetchNotionPageText(pageId, headers) {
    let textLines = [];
    try {
      let cursor = undefined;
      do {
        const urlStr = `https://api.notion.com/v1/blocks/${pageId}/children${cursor ? `?start_cursor=${cursor}` : ''}`;
        const res = await fetch(urlStr, { headers });
        if (!res.ok) break;
        const data = await res.json();
        for (const block of data.results || []) {
          const type = block.type;
          const rich = block[type]?.rich_text;
          if (rich && Array.isArray(rich)) {
            const plain = rich.map(r => r.plain_text).join('').trim();
            if (plain) textLines.push(plain);
          } else if (type === 'child_database') {
            textLines.push(`[Database: ${block.child_database?.title || ''}]`);
          } else if (type === 'child_page') {
            textLines.push(`[Sub-Page: ${block.child_page?.title || ''}]`);
          }
        }
        cursor = data.has_more ? data.next_cursor : undefined;
      } while (cursor);
    } catch (err) {
      console.warn(`Error fetching blocks for page ${pageId}:`, err.message);
    }
    return textLines.join('\n');
  }

  // Helper: Extract summaries from a Notion database
  async function fetchNotionDatabaseSummary(dbId, headers) {
    let summaries = [];
    try {
      const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ page_size: 30 })
      });
      if (res.ok) {
        const data = await res.json();
        for (const row of data.results || []) {
          let rowDetails = [];
          for (const [propName, propVal] of Object.entries(row.properties || {})) {
            if (propVal.type === 'title') {
              const t = propVal.title?.map(x => x.plain_text).join('') || '';
              if (t) rowDetails.unshift(`Title: ${t}`);
            } else if (propVal.type === 'rich_text') {
              const txt = propVal.rich_text?.map(x => x.plain_text).join('') || '';
              if (txt) rowDetails.push(`${propName}: ${txt}`);
            } else if (propVal.type === 'select' && propVal.select?.name) {
              rowDetails.push(`${propName}: ${propVal.select.name}`);
            } else if (propVal.type === 'multi_select') {
              const vals = propVal.multi_select?.map(x => x.name).join(', ');
              if (vals) rowDetails.push(`${propName}: ${vals}`);
            } else if (propVal.type === 'number' && propVal.number != null) {
              rowDetails.push(`${propName}: ${propVal.number}`);
            }
          }
          if (rowDetails.length) summaries.push(rowDetails.join(' | '));
        }
      }
    } catch (err) {
      console.warn(`Error querying database ${dbId}:`, err.message);
    }
    return summaries.join('\n');
  }

  // API endpoint: Search Notion workspace for pages & databases
  if (pathname === '/api/notion/search-workspace' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const query = (data.query || '').trim();
        const filterType = data.filterType || 'all';

        if (!notionToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
          return;
        }

        const searchPayload = {
          query: query,
          page_size: 25
        };
        if (filterType === 'page' || filterType === 'database') {
          searchPayload.filter = { property: 'object', value: filterType };
        }

        const searchRes = await fetch('https://api.notion.com/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchPayload)
        });

        const searchData = await searchRes.json();
        if (!searchRes.ok) {
          res.writeHead(searchRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: searchData.message || 'Search failed' }));
          return;
        }

        const internalSubDbs = [
          '8aa4565541fd4e49b157c6ebbc1d7ea7',
          '8aa45655-41fd-4e49-b157-c6ebbc1d7ea7',
          '1c80472918b54f7190d2d1259d7c7a9e',
          '1c804729-18b5-4f71-90d2-d1259d7c7a9e',
          'd120bddac12646d490a8d9fa02a800d2',
          'd120bdda-c126-46d4-90a8-d9fa02a800d2'
        ];

        const results = (searchData.results || [])
          .filter(item => {
            // Keep all standalone databases
            if (item.object === 'database') return true;
            // Exclude granular database row pages from the internal Questions, Options, and Responses databases
            const parentDb = item.parent?.database_id;
            if (parentDb && internalSubDbs.includes(parentDb)) return false;
            return true;
          })
          .map(item => {
          let title = 'Untitled';
          if (item.title && Array.isArray(item.title) && item.title.length > 0) {
            title = item.title.map(t => t.plain_text).join('');
          } else if (item.properties) {
            for (const prop of Object.values(item.properties)) {
              if (prop.type === 'title' && prop.title && prop.title.length > 0) {
                title = prop.title.map(t => t.plain_text).join('');
                break;
              }
            }
          }

          let icon = item.object === 'database' ? '🗄️' : '📄';
          if (item.icon?.emoji) icon = item.icon.emoji;

          return {
            id: item.id,
            object: item.object,
            title: title || 'Untitled',
            icon: icon,
            url: item.url,
            lastEditedTime: item.last_edited_time
          };
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, results }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Fetch vault tabs from Notion Parent Tab property
  if (pathname === '/api/notion/vault-tabs' && req.method === 'GET') {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      const vaultDbId = process.env.NOTION_VAULT_DATABASE_ID || '412138c820f38190b661cc316102d4fc';

      if (!notionToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
        return;
      }

      const dbRes = await fetch(`https://api.notion.com/v1/databases/${vaultDbId}`, {
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });
      const dbData = await dbRes.json();
      if (!dbRes.ok) {
        res.writeHead(dbRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: dbData.message || 'Failed to fetch database' }));
        return;
      }

      const options = dbData.properties?.['Parent Tab']?.select?.options || [
        { name: 'Working Style & Skills', color: 'blue' },
        { name: 'Limits & Health', color: 'red' },
        { name: 'Personality & Traits', color: 'purple' },
        { name: 'Custom Directives', color: 'green' }
      ];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tabs: options }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API endpoint: Manage vault tabs (create, rename, delete) and mirror to Notion
  if (pathname === '/api/notion/vault-tabs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const vaultDbId = process.env.NOTION_VAULT_DATABASE_ID || '412138c820f38190b661cc316102d4fc';
        const { action, tabName, newTabName, color } = data;

        if (!notionToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
          return;
        }

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        // 1. Fetch current database schema
        const dbRes = await fetch(`https://api.notion.com/v1/databases/${vaultDbId}`, { headers });
        const dbData = await dbRes.json();
        if (!dbRes.ok) {
          res.writeHead(dbRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: dbData.message || 'Failed to fetch database schema' }));
          return;
        }

        let currentOptions = dbData.properties?.['Parent Tab']?.select?.options || [];

        if (action === 'create') {
          const cleanName = (tabName || '').trim();
          if (!cleanName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tab name cannot be empty' }));
            return;
          }

          if (!currentOptions.some(o => o.name.toLowerCase() === cleanName.toLowerCase())) {
            const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'red', 'yellow'];
            const randomColor = color || colors[Math.floor(Math.random() * colors.length)];
            currentOptions.push({ name: cleanName, color: randomColor });

            await fetch(`https://api.notion.com/v1/databases/${vaultDbId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                properties: {
                  'Parent Tab': {
                    select: {
                      options: currentOptions.map(o => ({ name: o.name, color: o.color }))
                    }
                  }
                }
              })
            });
          }
        } else if (action === 'rename') {
          const oldName = (tabName || '').trim();
          const targetName = (newTabName || '').trim();
          if (!oldName || !targetName) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Old and new tab names are required' }));
            return;
          }

          currentOptions = currentOptions.map(o => {
            if (o.name === oldName) return { ...o, name: targetName };
            return o;
          });

          // Update DB schema
          await fetch(`https://api.notion.com/v1/databases/${vaultDbId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Parent Tab': {
                  select: {
                    options: currentOptions.map(o => ({ name: o.name, color: o.color }))
                  }
                }
              }
            })
          });

          // Also update all existing rows assigned to oldName
          const queryRes = await fetch(`https://api.notion.com/v1/databases/${vaultDbId}/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              filter: {
                property: 'Parent Tab',
                select: { equals: oldName }
              }
            })
          });
          const queryData = await queryRes.json();
          for (const row of (queryData.results || [])) {
            await fetch(`https://api.notion.com/v1/pages/${row.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                properties: {
                  'Parent Tab': { select: { name: targetName } }
                }
              })
            });
          }
        } else if (action === 'delete') {
          const deleteName = (tabName || '').trim();
          currentOptions = currentOptions.filter(o => o.name !== deleteName);

          // Update DB schema
          await fetch(`https://api.notion.com/v1/databases/${vaultDbId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Parent Tab': {
                  select: {
                    options: currentOptions.map(o => ({ name: o.name, color: o.color }))
                  }
                }
              }
            })
          });

          // Soft delete all rows in this tab
          const queryRes = await fetch(`https://api.notion.com/v1/databases/${vaultDbId}/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              filter: {
                property: 'Parent Tab',
                select: { equals: deleteName }
              }
            })
          });
          const queryData = await queryRes.json();
          for (const row of (queryData.results || [])) {
            await fetch(`https://api.notion.com/v1/pages/${row.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                properties: {
                  'Status': { select: { name: 'Deleted' } }
                }
              })
            });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, tabs: currentOptions }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Create or Add a Vault Block directly into Notion Master Vault
  if (pathname === '/api/notion/create-vault-block' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const vaultDbId = process.env.NOTION_VAULT_DATABASE_ID || '412138c820f38190b661cc316102d4fc';

        if (!notionToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
          return;
        }

        const blockText = (data.text || '').trim();
        const parentTab = data.parentTab || 'Working Style & Skills';
        const headingGroup = data.headingGroup || 'General';
        const isPinned = !!data.isPinned;
        const todayStr = new Date().toISOString().split('T')[0];
        const blockUniqueId = data.blockId || `CTX-${Date.now()}-${Math.floor(Math.random()*1000)}`;

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        const pageRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: vaultDbId },
            properties: {
              'Context Block': { title: [{ text: { content: blockText.slice(0, 1900) } }] },
              'Block ID': { rich_text: [{ text: { content: blockUniqueId } }] },
              'Parent Tab': { select: { name: parentTab } },
              'Heading Title Group': { select: { name: headingGroup } },
              'Status': { select: { name: isPinned ? 'Pinned' : 'New' } },
              'Is Pinned': { checkbox: isPinned },
              'Date Generated': { date: { start: todayStr } },
              'Source Pages': { rich_text: [{ text: { content: data.sourcePages || 'Manual Entry' } }] }
            }
          })
        });

        const pageData = await pageRes.json();
        if (!pageRes.ok) {
          res.writeHead(pageRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: pageData.message || 'Failed to create block in Notion' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          block: {
            id: pageData.id,
            blockId: blockUniqueId,
            text: blockText,
            parentTab,
            headingGroup,
            status: isPinned ? 'Pinned' : 'New',
            isPinned,
            dateGenerated: todayStr,
            sourcePages: data.sourcePages || 'Manual Entry'
          }
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Fetch active context blocks from Notion Master Vault Database
  if (pathname === '/api/notion/vault-blocks' && req.method === 'GET') {
    try {
      const notionToken = process.env.NOTION_TOKEN;
      const vaultDbId = process.env.NOTION_VAULT_DATABASE_ID || '412138c820f38190b661cc316102d4fc';
      const tabFilter = reqUrl.searchParams.get('tab');

      if (!notionToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
        return;
      }

      const filterConditions = [
        {
          property: 'Status',
          select: {
            does_not_equal: 'Deleted'
          }
        }
      ];

      if (tabFilter) {
        filterConditions.push({
          property: 'Parent Tab',
          select: {
            equals: tabFilter
          }
        });
      }

      const queryPayload = {
        filter: filterConditions.length > 1 ? { and: filterConditions } : filterConditions[0],
        sorts: [
          { property: 'Is Pinned', direction: 'descending' },
          { property: 'Heading Title Group', direction: 'ascending' }
        ],
        page_size: 100
      };

      const resDb = await fetch(`https://api.notion.com/v1/databases/${vaultDbId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryPayload)
      });

      const dbData = await resDb.json();
      if (!resDb.ok) {
        res.writeHead(resDb.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: dbData.message || 'Failed to fetch vault blocks' }));
        return;
      }

      const blocks = (dbData.results || []).map(r => {
        const text = r.properties['Context Block']?.title?.[0]?.plain_text || '';
        const blockId = r.properties['Block ID']?.rich_text?.[0]?.plain_text || r.id;
        const parentTab = r.properties['Parent Tab']?.select?.name || 'Working Style & Skills';
        const headingGroup = r.properties['Heading Title Group']?.select?.name || 'Core Skills';
        const status = r.properties['Status']?.select?.name || 'New';
        const isPinned = r.properties['Is Pinned']?.checkbox || false;
        const dateGenerated = r.properties['Date Generated']?.date?.start || '';
        const originalText = r.properties['Original Text']?.rich_text?.[0]?.plain_text || '';
        const sourcePages = r.properties['Source Pages']?.rich_text?.[0]?.plain_text || '';
        const editedFrom = r.properties['Edited From']?.relation?.map(x => x.id) || [];

        return {
          id: r.id,
          blockId,
          text,
          parentTab,
          headingGroup,
          status,
          isPinned,
          dateGenerated,
          originalText,
          sourcePages,
          editedFrom
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, blocks }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API endpoint: Update, Pin, Unpin, Edit (with history), Move Group, or Soft-Delete a Vault Block in Notion
  if (pathname === '/api/notion/update-vault-block' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const vaultDbId = process.env.NOTION_VAULT_DATABASE_ID || '412138c820f38190b661cc316102d4fc';
        const { pageId, action, updates = {} } = data;

        if (!notionToken || !pageId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN or pageId' }));
          return;
        }

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        if (action === 'pin') {
          await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Is Pinned': { checkbox: true },
                'Status': { select: { name: 'Pinned' } }
              }
            })
          });
        } else if (action === 'unpin') {
          await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Is Pinned': { checkbox: false },
                'Status': { select: { name: 'New' } }
              }
            })
          });
        } else if (action === 'delete') {
          await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Status': { select: { name: 'Deleted' } },
                'Is Pinned': { checkbox: false }
              }
            })
          });
        } else if (action === 'move_group') {
          await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Heading Title Group': { select: { name: updates.headingGroup || 'General' } }
              }
            })
          });
        } else if (action === 'edit') {
          const newText = (updates.text || '').trim();
          const oldText = (updates.originalText || '').trim();
          const parentTab = updates.parentTab || 'Working Style & Skills';
          const headingGroup = updates.headingGroup || 'Core Skills';
          const isPinned = updates.isPinned || false;

          // 1. Create a revision page in Notion linking to original pageId via Edited From self-relation
          const createRevRes = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              parent: { database_id: vaultDbId },
              properties: {
                'Context Block': { title: [{ text: { content: newText.slice(0, 1900) } }] },
                'Block ID': { rich_text: [{ text: { content: `CTX-${Date.now()}` } }] },
                'Parent Tab': { select: { name: parentTab } },
                'Heading Title Group': { select: { name: headingGroup } },
                'Status': { select: { name: isPinned ? 'Pinned' : 'Edited' } },
                'Is Pinned': { checkbox: isPinned },
                'Date Generated': { date: { start: new Date().toISOString().split('T')[0] } },
                'Original Text': { rich_text: [{ text: { content: oldText.slice(0, 1900) } }] },
                'Edited From': { relation: [{ id: pageId }] }
              }
            })
          });
          const revData = await createRevRes.json();

          // 2. Mark previous page as Deleted/Replaced so it is archived from active view
          await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              properties: {
                'Status': { select: { name: 'Deleted' } }
              }
            })
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, newBlockId: revData.id }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Generate context blocks from selected Notion pages & persist to Notion
  if (pathname === '/api/notion/generate-vault-blocks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const notionToken = process.env.NOTION_TOKEN;
        const vaultDbId = process.env.NOTION_VAULT_DATABASE_ID || '412138c820f38190b661cc316102d4fc';
        const apiKey = data.apiKey || process.env.GEMINI_API_KEY;
        const selectedSources = data.selectedSources || []; // [{ id, title, object }]
        const parentTab = data.parentTab || 'Working Style & Skills';
        const existingBlocks = data.existingBlocks || []; // keep pinned blocks!

        if (!notionToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing NOTION_TOKEN in .env' }));
          return;
        }

        if (!selectedSources.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please select at least one Notion page or database as source.' }));
          return;
        }

        const headers = {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        // 1. Fetch text from all selected Notion sources
        let sourceCorpus = '';
        const sourceTitles = [];
        for (const src of selectedSources) {
          sourceTitles.push(src.title);
          sourceCorpus += `\n\n=== SOURCE: [${src.object.toUpperCase()}] ${src.title} ===\n`;
          if (src.object === 'database') {
            const dbSummary = await fetchNotionDatabaseSummary(src.id, headers);
            sourceCorpus += dbSummary || '(Empty database)';
          } else {
            const pageText = await fetchNotionPageText(src.id, headers);
            sourceCorpus += pageText || '(Empty page)';
          }
        }

        // 2. Separate existing pinned blocks so they are guaranteed preserved
        const pinnedBlocks = existingBlocks.filter(b => b.isPinned);
        const pinnedSummary = pinnedBlocks.map(b => `[PINNED][${b.headingGroup}] ${b.text}`).join('\n');

        let generatedGroups = [];

        if (apiKey) {
          const prompt = `You are an elite Knowledge and Context Architect compiling a user's Master Profile Vault for category: "${parentTab}".
Analyze the following source material extracted directly from the user's Notion workspace:

${sourceCorpus.slice(0, 16000)}

${pinnedSummary ? `\nCRITICAL RULE: The user already has the following PINNED blocks which MUST NEVER be overwritten or contradicted:\n${pinnedSummary}\n` : ''}

TASK:
Extract and synthesize high-density, atomic, line-by-line context bullets/blocks for the "${parentTab}" profile tab.
Group the bullets into logical heading categories appropriate for this tab:
- For "Working Style & Skills": use headings like "Core Skills", "Reported Interests", "Working Preferences", "Cognitive Architecture", etc.
- For "Limits & Health": use headings like "Health Boundaries", "Operational Non-Negotiables", "Budget & Resource Caps", "Schedule & Time Allocations", etc.
- For "Personality & Traits": use headings like "Personality Profile", "Cognitive Biases & Strengths", "Communication Style", "Core Philosophies", etc.
- For "Custom Directives": use headings like "Strategic Directives", "Project Artifacts & References", "Custom Rules", "Domain Expertise", etc.
- If unsure: choose clean, meaningful 2-3 word section headings matching the theme.

Return ONLY a valid JSON object matching this schema (no markdown formatting, no backticks):
{
  "headingGroups": [
    {
      "headingTitle": "Core Skills",
      "headingDescription": "Technical capabilities, engineering proficiencies, and system tools",
      "blocks": [
        "Concrete bullet point summarizing a skill or capability",
        "Another distinct context bullet"
      ]
    },
    {
      "headingTitle": "Working Preferences",
      "headingDescription": "Environmental preferences, autonomy requirements, and collaboration style",
      "blocks": [
        "First working preference bullet",
        "Second working preference bullet"
      ]
    }
  ]
}`;

          try {
            const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            });
            if (gRes.ok) {
              const gJson = await gRes.json();
              const text = gJson.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
              const parsed = JSON.parse(text);
              generatedGroups = parsed.headingGroups || [];
            }
          } catch (e) {
            console.warn('Gemini context synthesis error:', e.message);
          }
        }

        // Fallback if AI was unavailable
        if (!generatedGroups.length) {
          generatedGroups = [
            {
              headingTitle: 'Extracted Highlights',
              headingDescription: 'Context extracted from selected Notion pages',
              blocks: sourceTitles.map(t => `Referenced source: ${t} - contains active project and profile parameters.`)
            }
          ];
        }

        // 3. Instead of automatically writing pages to Notion, return candidate blocks for user review & selection
        const candidateBlocks = [];
        const todayStr = new Date().toISOString().split('T')[0];
        const sourcePagesStr = sourceTitles.join(', ').slice(0, 1900);

        for (const grp of generatedGroups) {
          const heading = grp.headingTitle || 'General';
          for (const blockText of (grp.blocks || [])) {
            const cleanText = String(blockText).trim();
            if (!cleanText) continue;

            const blockUniqueId = `CAND-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            candidateBlocks.push({
              id: blockUniqueId,
              blockId: blockUniqueId,
              text: cleanText,
              parentTab: parentTab,
              headingGroup: heading,
              status: 'Candidate',
              isPinned: false,
              dateGenerated: todayStr,
              sourcePages: sourcePagesStr,
              headingDescription: grp.headingDescription || ''
            });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          candidateBlocks: candidateBlocks,
          headingGroups: generatedGroups
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Generate custom dynamic questionnaire on the fly
  if (pathname === '/api/generate-questions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const apiKey = (data.apiKey && data.apiKey.trim()) || process.env.GEMINI_API_KEY;

        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Missing Gemini API Key. Provide it in the UI or set GEMINI_API_KEY in the .env file.'
          }));
          return;
        }

        const model = data.model || 'gemini-3.5-flash-lite';
        const userGoal = data.goal || 'General project planning';
        const numQuestions = data.numQuestions || 8;
        const masterContext = data.masterContext || '';
        const notionToken = process.env.NOTION_TOKEN;
        const selectedNotionSources = data.selectedNotionSources || []; // [{ id, title, object }]

        // Fetch text from any selected Notion Workspace pages/databases or AI summaries
        let notionContextCorpus = '';
        if (notionToken && selectedNotionSources.length > 0) {
          const headers = {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          };
          for (const src of selectedNotionSources) {
            notionContextCorpus += `\n\n=== NOTION GROUNDING SOURCE: [${src.object.toUpperCase()}] ${src.title} ===\n`;
            try {
              if (src.object === 'database') {
                const dbSummary = await fetchNotionDatabaseSummary(src.id, headers);
                notionContextCorpus += dbSummary || '(Empty database)';
              } else {
                const pageText = await fetchNotionPageText(src.id, headers);
                notionContextCorpus += pageText || '(Empty page)';
              }
            } catch (err) {
              console.warn(`Failed to read Notion source ${src.title}:`, err.message);
            }
          }
        }

        const systemInstruction = `You are an expert diagnostic interviewer and requirements architect.
For the user's initiative: "${userGoal}", produce:
1. "title": A concise, clean, prettified title (3 to 6 words, e.g. "Micro-SaaS Discovery", "B2B Outreach Blueprint") summarizing the initiative.
2. "questions": An array of ${numQuestions} structured clarifying diagnostic questions designed to extract all necessary parameters, constraints, preferences, and boundary conditions.

Master background context available about user:
${masterContext || 'None provided'}
${notionContextCorpus ? `\nActive Workspace Knowledge & Grounding Documents:\n${notionContextCorpus.slice(0, 16000)}` : ''}

RULES:
1. Return ONLY a valid JSON object matching this schema (no markdown code blocks, no backticks, no commentary):
{
  "title": "Clean Prettified Title",
  "questions": [
    {
      "id": "unique_snake_case_id",
      "type": "select" | "multiselect" | "text" | "textarea" | "ranked",
      "label": "The concise, clear question label",
      "helpText": "Explanation or guidance for answering",
      "options": ["Option 1", "Option 2", ...], // REQUIRED if type is "select", "multiselect", or "ranked"
      "placeholder": "Placeholder guidance" // REQUIRED if type is "text" or "textarea"
    }
  ]
}
2. Mix question types effectively: use choice questions with 3-5 distinct options, "textarea" for complex context or trade-offs, and "text" for short specifics.
3. If Notion workspace documents or reports are provided above, directly integrate and reflect their specific concepts, constraints, entities, and requirements into the questions so the questions are deeply informed by the user's workspace.
4. Craft questions that directly clarify trade-offs, constraints, timeline, preferences, and deliverables.`;

        const requestPayload = {
          contents: [{ role: 'user', parts: [{ text: `Generate diagnostic questionnaire for: ${userGoal}` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json'
          }
        };

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        const geminiJson = await geminiRes.json();

        if (!geminiRes.ok) {
          res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: geminiJson.error?.message || 'Questionnaire generation failed',
            details: geminiJson
          }));
          return;
        }

        let rawText = geminiJson.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '{}';
        // Clean out possible markdown code blocks if present
        rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        const parsed = JSON.parse(rawText);
        let title = userGoal.slice(0, 30);
        let questions = [];

        if (Array.isArray(parsed)) {
          questions = parsed;
        } else if (parsed && typeof parsed === 'object') {
          title = parsed.title || title;
          questions = parsed.questions || [];
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          title: title,
          questions: questions
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API generate endpoint
  if (pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const apiKey = (data.apiKey && data.apiKey.trim()) || process.env.GEMINI_API_KEY;

        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Missing Gemini API Key. Provide it in the UI or set GEMINI_API_KEY in the .env file.'
          }));
          return;
        }

        const model = data.model || 'gemini-3.5-flash-lite';
        const systemPrompt = data.systemPrompt || '';
        const userContent = data.prompt || '';

        // Gemini REST API Payload
        const contents = [];
        if (userContent) {
          contents.push({
            role: 'user',
            parts: [{ text: userContent }]
          });
        }

        const requestPayload = {
          contents: contents
        };

        if (systemPrompt) {
          requestPayload.systemInstruction = {
            parts: [{ text: systemPrompt }]
          };
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        const geminiJson = await geminiRes.json();

        if (!geminiRes.ok) {
          res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: geminiJson.error?.message || 'Gemini API call failed',
            details: geminiJson
          }));
          return;
        }

        const candidateText = geminiJson.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          text: candidateText,
          raw: geminiJson
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Get change notes
  if (pathname === '/api/change-notes' && req.method === 'GET') {
    try {
      const notesPath = path.join(__dirname, 'change_notes.json');
      let notes = [];
      if (fs.existsSync(notesPath)) {
        notes = JSON.parse(fs.readFileSync(notesPath, 'utf8') || '[]');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, notes }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API endpoint: Save change notes
  if (pathname === '/api/change-notes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const notes = data.notes || [];
        const notesPath = path.join(__dirname, 'change_notes.json');
        fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: notes.length }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API endpoint: Get Git version history / commits
  if (pathname === '/api/version-history' && req.method === 'GET') {
    exec('git log -n 15 --pretty=format:"%h|%an|%ar|%s"', { cwd: __dirname }, (err, stdout) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      const commits = stdout.split('\n').filter(Boolean).map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, commits }));
    });
    return;
  }

  // API endpoint: Create a named snapshot checkpoint in Git and automatically push to GitHub
  if (pathname === '/api/version-history/snapshot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const customMessage = (data.message || 'Manual snapshot save state').replace(/"/g, '\\"');
        const commitMsg = `checkpoint: ${customMessage} [${new Date().toLocaleString()}]`;

        // 1. Commit changes
        exec(`git add . && git commit -m "${commitMsg}"`, { cwd: __dirname }, (commitErr, commitStdout) => {
          // If no changes to commit, still try pushing any unpushed commits
          const hasCommitted = !commitErr && !commitStdout.includes('nothing to commit');

          // 2. Automatically push to GitHub
          exec('git push origin main', { cwd: __dirname }, (pushErr, pushStdout, pushStderr) => {
            const pushSuccess = !pushErr;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: commitMsg,
              pushedToGitHub: pushSuccess,
              repoUrl: 'https://github.com/artytay/Contexflow',
              details: commitStdout || 'Working tree clean',
              pushOutput: pushStdout || (pushErr ? pushStderr : 'Up to date with origin/main')
            }));
          });
        });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') safePath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Dynamic Context Questionnaire server running on http://localhost:${PORT}`);
});

