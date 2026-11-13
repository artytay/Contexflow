export const WORKFLOWS = {
  certifications: {
    id: 'certifications',
    name: 'High-ROI Short Courses & Certs',
    badge: 'Career Leverage',
    description: 'Finds high-paying, low-barrier short courses & certifications tailored to your skills, health limits, and earning goals.',
    systemPrompt: `You are a high-level Career Strategy & Executive Talent Architect.
Your task is to analyze the user's questionnaire responses combined with their Master Profile Vault (personality, working preferences, existing skills, health/energy constraints, and non-negotiables).
Generate an actionable, prioritized roadmap of Top 3-5 High-Paying, Low-Barrier-to-Entry Short Courses / Certifications that will maximize their earning potential.

For each recommended certification/course, provide:
1. Certification Name & Issuing Body / Platform
2. Realistic Time to Complete (hours/weeks) & Cost (free or low fee)
3. Difficulty & Barrier Level (and why it fits their background)
4. Target Job Titles / Contract Opportunities & Expected Earning Impact (market day rates or salary bump)
5. Direct Alignment with their Working Preferences & Health/Schedule Limits
6. Recommended First Step to start today.`,
    questions: [
      {
        id: 'priority_ranking',
        type: 'ranked',
        label: 'Rank Your Top Priorities for This Certification',
        helpText: 'Click options in order of importance. Choose at least your #1 Top Pick and #2 Secondary (3rd, 4th, 5th are optional). Click an assigned rank to remove it.',
        minRequired: 2,
        options: [
          'Highest Earning / Billable Day-Rate Potential ($100+/hr or $150k+)',
          'Lowest Barrier to Entry & Fastest Completion (Under 4-6 weeks)',
          'Directly Amplifies My Existing Notion, Systems & Automation Skills',
          'Highest Remote / Asynchronous Contract Demand (Zero micromanagement)',
          'Prestigious / Recognizable Industry Brand (Instant credibility)',
          'Highest Practical Portfolio Proof (Project-based vs. rote exam)'
        ]
      },
      {
        id: 'current_earnings_target',
        type: 'select',
        label: 'What is your immediate financial or rate milestone?',
        helpText: 'Select the income profile you are aiming to unlock.',
        options: [
          'High Hourly Freelance / Contract Rate ($75 - $150+/hr)',
          'Senior Full-time Role ($120k - $180k+ / yr)',
          'Executive / High-Specialty Consulting ($200k+ / yr)',
          'Immediate Fast Upskill / Quickest Monetizable Win'
        ]
      },
      {
        id: 'weekly_time_commitment',
        type: 'select',
        label: 'How many realistic hours per week can you allocate to learning?',
        helpText: 'We respect your health and energy boundaries.',
        options: [
          'Ultra-lean: 3 to 5 hours / week (Micro-learning & self-paced)',
          'Moderate: 5 to 10 hours / week',
          'Dedicated: 10 to 15 hours / week',
          'Sprint Mode: 15 to 20+ hours / week'
        ]
      },
      {
        id: 'target_domains',
        type: 'multiselect',
        label: 'Which domains are you most interested in stacking skills into?',
        helpText: 'Select all domains that appeal to your interests (multi-select enabled).',
        options: [
          'AI Solutions & Automation (Prompt Engineering, LLM Ops, Make/Zapier)',
          'Cloud Platforms & Data (GCP, AWS, Snowflake, BigQuery)',
          'Product Management & Agile (Scrum Master, Product Owner, PMP/CAPM)',
          'Business Operations & No-Code / Notion Architecture',
          'Cybersecurity & Privacy Compliance (CompTIA Sec+, ISO, SOC2)',
          'UX Research & Product Strategy'
        ]
      },
      {
        id: 'strict_must_nots',
        type: 'suggestions_with_custom',
        label: 'Strict Dealbreakers & Must-Nots for These Courses',
        helpText: 'Click any of the 15 standard filters below to quickly disqualify recommendations, then add any custom limitations or health notes in the text box.',
        customPlaceholder: 'Type any other specific health limits, budget caps, or personal dealbreakers...',
        suggestions: [
          'No mandatory live video cohorts or fixed scheduled calls',
          'No proctored webcam / invasive room-scan exams',
          'No heavy coding / complex calculus / software engineering math',
          'No programs taking longer than 4-6 weeks to complete',
          'No expensive annual renewal fees or recertification maintenance CEUs',
          'No purely academic theory without practical portfolio proof',
          'No mandatory group projects or team-dependent grading',
          'No synchronous oral presentations or recorded video pitches',
          'No certifications without verified contract day-rate market demand',
          'No dying legacy vendor platforms with declining adoption',
          'No high exam failure rates (>50%) requiring costly paid retakes',
          'No heavy rote memorization; open-book / project testing preferred',
          'No full-time immersion; must easily fit within 5-10 hrs/week',
          'No unpaid internships or mandatory in-person shadow hours',
          'No physical testing centers; must be 100% online from home'
        ]
      },
      {
        id: 'leverage_assets',
        type: 'textarea',
        label: 'Specific existing skills you want to build on or leverage',
        placeholder: 'e.g. Deep experience with Notion and project coordination; strong written communication; comfortable with basic Python and logic flows...',
        helpText: 'Any particular strengths you want the certification to amplify.'
      }
    ]
  },

  cover_letter: {
    id: 'cover_letter',
    name: 'Targeted Cover Letter & Application Strategy',
    badge: 'Job Search',
    description: 'Generates high-conversion cover letters and positioning briefs calibrated to your background and target role.',
    systemPrompt: `You are an elite Executive Career Coach and Talent Advisor.
Using the user's questionnaire responses together with their Master Profile Vault (personality traits, skills matrix, past achievements, and tone preferences), craft:
1. Strategic Role Alignment Brief (key hooks and positioning angle)
2. High-Impact, Modern Cover Letter (tailored, authentic, zero corporate cliché or robotic fluff)
3. Interview Talking Points (addressing potential questions and spotlighting unique strengths).`,
    questions: [
      {
        id: 'job_title_company',
        type: 'text',
        label: 'Target Job Title & Organization',
        placeholder: 'e.g. Head of Operations at Remote-first SaaS, or Senior Product Strategist at Figma',
        helpText: 'Who is the employer and what is the exact title?'
      },
      {
        id: 'job_posting_requirements',
        type: 'textarea',
        label: 'Paste Key Job Description Bullets or Role Mission',
        placeholder: 'Paste the top 3-6 requirements, responsibilities, or about-the-team sections from the listing...',
        helpText: 'The AI will directly map your credentials against these specific points.'
      },
      {
        id: 'top_proof_points',
        type: 'textarea',
        label: 'Your Top 2-3 Relevant Achievements or Projects for This Role',
        placeholder: 'e.g. Automated team onboarding saving 12 hrs/wk; authored documentation used by 50+ staff; designed workspace that boosted project delivery by 25%...',
        helpText: 'Real numbers, tangible outcomes, or specific wins.'
      },
      {
        id: 'tone_selection',
        type: 'ranked',
        label: 'Rank Your Desired Voice & Persona',
        helpText: 'Select your #1 Top Tone and #2 Secondary Tone.',
        minRequired: 1,
        options: [
          'Modern, Direct & Value-Driven (Founder/Operator style)',
          'Story-Led & Engaging (Mission-driven, high warmth)',
          'Thoughtful & Methodical (Engineering, Data & Systems)',
          'Executive & Strategic (Leadership, Advisory & Director)'
        ]
      },
      {
        id: 'cover_letter_dealbreakers',
        type: 'suggestions_with_custom',
        label: 'Cover Letter Dealbreakers & Style Constraints',
        helpText: 'Select stylistic traps to avoid and add any specific boundaries.',
        customPlaceholder: 'Add any specific topics to avoid or emphasize...',
        suggestions: [
          'No robotic AI clichés ("delighted to apply", "testament to", "fast-paced environment")',
          'No regurgitating the resume line-by-line',
          'Keep under 350 words (tight, readable on mobile)',
          'Highlight remote & asynchronous autonomy',
          'Address career transition or non-linear background gracefully',
          'Focus on quantifiable impact rather than generic responsibilities'
        ]
      }
    ]
  },

  notion_architecture: {
    id: 'notion_architecture',
    name: 'Notion Workspace & Workflow Optimizer',
    badge: 'Productivity Systems',
    description: 'Architects bespoke Notion databases, relations, rollups, views, and automated operating procedures.',
    systemPrompt: `You are a certified Notion Solutions Architect and Enterprise Productivity Consultant.
Synthesize the user's questionnaire responses and Master Profile Vault to create an architectural blueprint for their Notion workspace.
Provide:
1. High-Level Workspace Architecture (Information Hierarchy)
2. Database Specs (Database Name, Properties, Property Types, Select Options, Formula logic)
3. Relational Map (How databases connect via Relations and Rollups)
4. Core Views (Sprint Kanban, Daily Priority, Project Timeline, Client Hub)
5. Operating Rules & Maintenance SOP (Daily/Weekly review rituals that respect their working style).`,
    questions: [
      {
        id: 'primary_use_case',
        type: 'select',
        label: 'What is the primary scope of this Notion workspace?',
        options: [
          'Personal Operating System & Second Brain (Life, habits, learning, tasks)',
          'Solo Business / Freelance Client & Project Delivery Hub',
          'Small Agile Team Collaboration (Shared projects, wiki, sprints)',
          'Content Creation & Multi-Channel Publishing Engine',
          'Job Search & Networking Command Center'
        ],
        helpText: 'Select the primary operational focus.'
      },
      {
        id: 'current_bottlenecks',
        type: 'textarea',
        label: 'Current Friction & Pain Points in Your Workflow',
        placeholder: 'e.g. Information gets buried, too many loose pages, losing track of tasks due this week, inconsistent tagging...',
        helpText: 'What is currently frustrating or slow in your daily routine?'
      },
      {
        id: 'database_priority',
        type: 'ranked',
        label: 'Rank Your Core Database Priorities',
        helpText: 'Order your most critical databases: #1 Top Priority, #2 Secondary, etc.',
        minRequired: 2,
        options: [
          'Projects (Outcome-driven deliverables with deadlines)',
          'Tasks & Actions (Individual to-dos linked to projects)',
          'Resources & Reference Knowledge Base (Wikis, notes, SOPs)',
          'Contacts / CRM / Stakeholders (Clients, leads, team)',
          'Meeting Notes & Decisions Log',
          'Daily Logs & Energy / Habit Tracking'
        ]
      },
      {
        id: 'notion_dealbreakers',
        type: 'suggestions_with_custom',
        label: 'Workspace Constraints & Anti-Patterns to Avoid',
        helpText: 'Select common Notion failure modes you want to guard against.',
        customPlaceholder: 'Add any specific preferences about views, mobile entry, or templates...',
        suggestions: [
          'Avoid over-engineered relations that take too long to maintain',
          'Must be fast and seamless to capture notes on mobile',
          'No empty databases that require manual daily data entry',
          'Strict separation between active projects and archived reference notes',
          'Prefer simple status select tags over complex nested rollup formulas',
          'Must have a single master dashboard showing only what is due today'
        ]
      }
    ]
  },

  task_clarifier: {
    id: 'task_clarifier',
    name: 'General Adaptive Task Clarifier',
    badge: 'Universal',
    description: 'Dynamic questionnaire that unpacks any ambiguous goal, defines parameters, and builds an execution plan.',
    systemPrompt: `You are a Principal AI Strategist and Systems Prompt Architect.
Evaluate the user's answers along with their Master Profile Vault to construct a comprehensive Master Execution Package:
1. Clarified Objective & Definition of Done
2. Strategic Blueprint & Phased Milestones
3. Potential Risks, Traps & Failure Mitigations
4. Custom Optimized Prompts to execute each milestone.`,
    questions: [
      {
        id: 'goal_summary',
        type: 'textarea',
        label: 'What task or initiative do you want to tackle?',
        placeholder: 'Describe what you want to achieve or build in plain English...',
        helpText: 'Be as brief or as descriptive as you like.'
      },
      {
        id: 'success_criteria_priority',
        type: 'ranked',
        label: 'Rank What Defines Success for This Task',
        helpText: 'Pick your #1 Top Criterion, #2 Secondary (others optional).',
        minRequired: 2,
        options: [
          'Speed & Rapid Execution (Fastest path to working version)',
          'High Rigor & Thoroughness (Zero edge cases missed)',
          'Maximal Simplicity & Minimal Cognitive Load',
          'Scalability & Long-Term Reusability'
        ]
      },
      {
        id: 'clarifier_dealbreakers',
        type: 'suggestions_with_custom',
        label: 'Constraints & Boundaries',
        helpText: 'Select common non-negotiables or add custom constraints.',
        customPlaceholder: 'Add any budget, deadline, or technical limits...',
        suggestions: [
          'Strict zero-cost / free tier tools only',
          'Must be completed in under 48 hours',
          'No complex setup or high learning curve dependencies',
          'Must run locally / privacy-preserving',
          'Asynchronous execution only'
        ]
      },
      {
        id: 'deliverable_format',
        type: 'select',
        label: 'What deliverable format will be most useful right now?',
        options: [
          'Step-by-step action plan with checklists',
          'Ready-to-use template or drafted document',
          'Prompt sequence / reusable AI instructions',
          'Executive recommendation & trade-off analysis'
        ],
        helpText: 'How would you like Gemini to present the solution?'
      }
    ]
  }
};
