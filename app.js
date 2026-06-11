// Global state
let currentProposal = SAMPLE_PROPOSALS[0];
let apiConfig = {
  provider: 'gemini',
  key: '',
  model: 'gemini-1.5-pro'
};

// Initialize elements
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadProposalList();
  renderProposal(SAMPLE_PROPOSALS[0]);
  setupEventListeners();
});

// Render pre-loaded proposal selections
function loadProposalList() {
  const container = document.getElementById('proposals-list');
  container.innerHTML = '';
  
  SAMPLE_PROPOSALS.forEach((prop, idx) => {
    const card = document.createElement('div');
    card.className = `template-card ${idx === 0 ? 'active' : ''}`;
    card.dataset.id = prop.id;
    card.innerHTML = `
      <h4>${prop.title.split(':')[0]}</h4>
      <p>${prop.summary}</p>
    `;
    
    card.addEventListener('click', () => {
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const selected = SAMPLE_PROPOSALS.find(p => p.id === prop.id);
      renderProposal(selected);
    });
    
    container.appendChild(card);
  });
}

// Display the selected proposal blueprint inside the dashboard
function renderProposal(proposal) {
  currentProposal = proposal;
  
  // Update raw proposal inputs
  document.getElementById('custom-proposal-title').value = proposal.title;
  document.getElementById('custom-proposal-text').value = proposal.rawProposal;
  
  // Render high-level metrics
  document.getElementById('meta-category').textContent = proposal.blueprint.category;
  document.getElementById('meta-author').textContent = proposal.author;
  
  const riskLabel = document.getElementById('meta-risk-level');
  const riskReason = document.getElementById('meta-risk-reason');
  const riskCard = document.getElementById('metric-risk-card');
  
  riskLabel.textContent = proposal.blueprint.riskLevel.split('(')[0].trim();
  riskReason.textContent = proposal.blueprint.riskReason;
  
  // Adjust risk color classes
  riskCard.className = 'metric-card';
  if (proposal.blueprint.riskLevel.toLowerCase().includes('critical')) {
    riskCard.classList.add('risk-high');
  } else if (proposal.blueprint.riskLevel.toLowerCase().includes('high')) {
    riskCard.classList.add('risk-high');
  } else if (proposal.blueprint.riskLevel.toLowerCase().includes('medium')) {
    riskCard.classList.add('risk-medium');
  } else {
    riskCard.classList.add('risk-low');
  }
  
  document.getElementById('meta-cost').textContent = proposal.blueprint.infrastructure.estimatedCost;
  
  // Render Infrastructure details
  document.getElementById('infra-compute').textContent = proposal.blueprint.infrastructure.compute;
  document.getElementById('infra-storage').textContent = proposal.blueprint.infrastructure.storage;
  
  const apisText = proposal.blueprint.infrastructure.externalApis.map(api => `${api.name} (${api.purpose})`).join(', ');
  document.getElementById('infra-apis').textContent = apisText || 'None';
  document.getElementById('infra-software').textContent = proposal.blueprint.infrastructure.softwareLibraries.join(', ');
  
  // Render Gating Actions Timeline
  const timelineContainer = document.getElementById('gating-timeline');
  timelineContainer.innerHTML = '';
  
  proposal.blueprint.gatingActions.forEach((gate, idx) => {
    const node = document.createElement('div');
    node.className = `timeline-node ${idx === 0 ? 'active' : ''}`;
    node.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-phase">${gate.phase}</div>
        <div class="timeline-trigger">Trigger: ${gate.technicalTrigger}</div>
        <div class="timeline-gate"><strong>RPM Action Gate:</strong> ${gate.rpmGate}</div>
        <div class="timeline-mitigation"><strong>Risk Mitigation:</strong> ${gate.riskMitigation}</div>
      </div>
    `;
    
    // Toggle active nodes interactively
    node.addEventListener('click', () => {
      document.querySelectorAll('.timeline-node').forEach(n => n.classList.remove('active'));
      node.classList.add('active');
    });
    
    timelineContainer.appendChild(node);
  });
  
  // Render Translation table
  const tableBody = document.getElementById('translation-table-body');
  tableBody.innerHTML = '';
  
  proposal.blueprint.translationKeys.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="technical-badge">${t.technicalTerm}</span></td>
      <td>${t.laypersonMeaning}</td>
      <td><span class="operational-metric-badge">${t.operationalMetric}</span></td>
    `;
    tableBody.appendChild(row);
  });
  
  // Update cost calculator defaults based on proposal
  detectCalculatorParameters(proposal);
  
  // Refresh Lucide Icons
  lucide.createIcons();
}

// Extract base values to preload cost sandbox
function detectCalculatorParameters(proposal) {
  let rate = 3.50; // default rate
  let days = 5;    // default duration
  
  const computeStr = proposal.blueprint.infrastructure.compute.toLowerCase();
  
  if (computeStr.includes('h100')) {
    rate = 4.50;
  } else if (computeStr.includes('a100')) {
    rate = 3.50;
  } else if (computeStr.includes('rtx 4090') || computeStr.includes('a10g')) {
    rate = 1.50;
  }
  
  // Parse duration
  const daysMatch = computeStr.match(/(\d+)\s*days/);
  if (daysMatch) {
    days = parseInt(daysMatch[1], 10);
  }
  
  document.getElementById('gpu-rate-slider').value = rate;
  document.getElementById('duration-slider').value = days;
  updateSandboxCost(rate, days);
}

// Calculate sandbox cost
function updateSandboxCost(rate, days) {
  // Let's assume a node cluster is selected. Multiplier based on current proposal's node count.
  let gpuCount = 1;
  const computeStr = currentProposal.blueprint.infrastructure.compute.toLowerCase();
  const countMatch = computeStr.match(/(\d+)x/);
  if (countMatch) {
    gpuCount = parseInt(countMatch[1], 10);
  }
  
  const totalHours = days * 24;
  const cost = gpuCount * rate * totalHours;
  
  document.getElementById('gpu-rate-val').textContent = `$${parseFloat(rate).toFixed(2)}/Hr`;
  document.getElementById('duration-val').textContent = `${days} Days`;
  document.getElementById('sandbox-total-cost').textContent = `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Setup listeners
function setupEventListeners() {
  // Sliders
  const rateSlider = document.getElementById('gpu-rate-slider');
  const durationSlider = document.getElementById('duration-slider');
  
  rateSlider.addEventListener('input', () => {
    updateSandboxCost(rateSlider.value, durationSlider.value);
  });
  
  durationSlider.addEventListener('input', () => {
    updateSandboxCost(rateSlider.value, durationSlider.value);
  });
  
  // Drawer
  const toggleApiBtn = document.getElementById('toggle-api-btn');
  const closeApiBtn = document.getElementById('close-api-btn');
  const apiDrawer = document.getElementById('api-drawer');
  
  toggleApiBtn.addEventListener('click', () => {
    apiDrawer.classList.toggle('open');
  });
  
  closeApiBtn.addEventListener('click', () => {
    apiDrawer.classList.remove('open');
  });
  
  // Save credentials
  document.getElementById('save-api-config').addEventListener('click', () => {
    apiConfig.provider = document.getElementById('api-provider').value;
    apiConfig.key = document.getElementById('api-key-input').value;
    apiConfig.model = document.getElementById('model-name').value;
    apiDrawer.classList.remove('open');
    alert('API Settings saved successfully!');
  });
  
  // Parse Custom Proposal
  document.getElementById('parse-proposal-btn').addEventListener('click', handleCustomProposalParse);
  
  // Print/Export
  document.getElementById('export-pdf-btn').addEventListener('click', () => {
    window.print();
  });
}

// Perform client-side heuristics or LLM analysis
async function handleCustomProposalParse() {
  const title = document.getElementById('custom-proposal-title').value.trim();
  const text = document.getElementById('custom-proposal-text').value.trim();
  
  if (!title || !text) {
    alert('Please enter both a title and proposal text.');
    return;
  }
  
  const btn = document.getElementById('parse-proposal-btn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> Parsing Proposal...';
  lucide.createIcons();
  
  try {
    if (apiConfig.key) {
      // Live API parser call
      const blueprint = await callLlmParser(title, text);
      renderProposal({
        id: "custom_generated",
        title: title,
        author: "Custom Upload Analysis",
        summary: "Dynamically parsed blueprint generated via LLM integration.",
        rawProposal: text,
        blueprint: blueprint
      });
    } else {
      // Simulate high-fidelity translation offline using keyword lookup
      setTimeout(() => {
        const offlineBlueprint = generateOfflineBlueprint(title, text);
        renderProposal({
          id: "custom_generated",
          title: title,
          author: "Custom Proposal (Local Parse)",
          summary: "Parsed locally using heuristic analysis patterns.",
          rawProposal: text,
          blueprint: offlineBlueprint
        });
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="cpu"></i> Generate Blueprint';
        lucide.createIcons();
      }, 1200);
    }
  } catch (error) {
    alert(`Parsing Failed: ${error.message}`);
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="cpu"></i> Generate Blueprint';
    lucide.createIcons();
  }
}

// Unsupervised LLM Parser using provided keys
async function callLlmParser(title, text) {
  const prompt = `You are a Research Project Manager translator. Analyze this AI Safety research proposal:
Title: ${title}
Content: ${text}

Convert this into a valid JSON containing:
{
  "category": "High level research category",
  "difficulty": "Intermediate/Advanced/Expert",
  "riskLevel": "Low/Medium/High/Critical with brief reason",
  "riskReason": "Detailed reason why",
  "infrastructure": {
    "compute": "Specific GPU/Node configuration estimate",
    "estimatedCost": "Total dollar estimate",
    "storage": "Storage size scratch details",
    "externalApis": [{"name": "API name", "purpose": "why it is needed"}],
    "softwareLibraries": ["lib1", "lib2"]
  },
  "gatingActions": [
    {
      "id": "gate_1",
      "phase": "Phase title",
      "technicalTrigger": "Technical condition",
      "rpmGate": "Non-technical action that the RPM must do before releasing next resources",
      "riskMitigation": "How this mitigates risk"
    }
  ],
  "translationKeys": [
    {
      "technicalTerm": "Jargon Term",
      "laypersonMeaning": "Operational layperson explanation",
      "operationalMetric": "What indicator the RPM should track to verify execution"
    }
  ]
}
Return ONLY valid raw JSON without markdown markers.`;

  let response;
  if (apiConfig.provider === 'openai') {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.key}`
      },
      body: JSON.stringify({
        model: apiConfig.model || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content.trim());
  } else if (apiConfig.provider === 'gemini') {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${apiConfig.key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text.trim());
  } else if (apiConfig.provider === 'anthropic') {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiConfig.key,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-html-in-templates': 'true' // standard Client side warning
      },
      body: JSON.stringify({
        model: apiConfig.model || 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    return JSON.parse(data.content[0].text.trim());
  }
}

// Heuristic fallback generator when running without API keys
function generateOfflineBlueprint(title, text) {
  const contentLower = text.toLowerCase();
  
  // Heuristic determinations
  let category = "AI Safety Theory & Alignment";
  let riskLevel = "Medium";
  let riskReason = "Generic sandbox evaluation required.";
  let compute = "1x RTX 4090 for 3 days";
  let cost = "$100.00";
  let storage = "50 GB standard storage";
  let apis = [];
  let libs = ["PyTorch", "Hugging Face Transformers"];
  
  if (contentLower.includes("mechanistic") || contentLower.includes("sae") || contentLower.includes("interpretability")) {
    category = "Mechanistic Interpretability";
    riskLevel = "High (Compute & Storage Bound)";
    riskReason = "Activation caching requires substantial storage throughput and high VRAM layers.";
    compute = "8x A100 (80GB) Node for 8 days";
    cost = "$2,400.00";
    storage = "1.5 TB high-speed scratch space";
    libs.push("TransformerLens");
  } else if (contentLower.includes("red-team") || contentLower.includes("agent") || contentLower.includes("sandbox")) {
    category = "Agentic Red Teaming";
    riskLevel = "Critical (Sandbox Outbound Risk)";
    riskReason = "Agent has execution rights inside environment. Isolation checklist required.";
    compute = "4x A100 (80GB) for 5 days";
    cost = "$1,800.00";
    storage = "200 GB isolated workspace";
    apis.push({ name: "Anthropic Claude API", purpose: "Simulating agent decision patterns" });
  } else if (contentLower.includes("elk") || contentLower.includes("latent") || contentLower.includes("truth")) {
    category = "Eliciting Latent Knowledge (ELK)";
    riskLevel = "Medium";
    riskReason = "Low direct infrastructure threats. Cost sensitivity around evaluation tokens.";
    compute = "2x A10G (24GB VRAM) for 4 days";
    cost = "$220.00";
    apis.push({ name: "OpenAI GPT-4o API", purpose: "Evaluating response consistency" });
  }

  return {
    category: category,
    difficulty: "Advanced",
    riskLevel: riskLevel,
    riskReason: riskReason,
    infrastructure: {
      compute: compute,
      estimatedCost: cost,
      storage: storage,
      externalApis: apis,
      softwareLibraries: libs
    },
    gatingActions: [
      {
        id: "custom_gate_1",
        phase: "Phase 1: Environment Isolation Setup",
        technicalTrigger: "Verify setup directories are configured and permissions validated",
        rpmGate: "Ensure scratch space folder size quotas are strictly bounded before executing training scripts.",
        riskMitigation: "Avoids memory overflow crashes on the host system."
      },
      {
        id: "custom_gate_2",
        phase: "Phase 2: Baseline Performance Validation",
        technicalTrigger: "Run evaluation check on 10% test data split",
        rpmGate: "Ask mentor to confirm target accuracy metric exceeds 70% before spending full GPU resources.",
        riskMitigation: "Prevents full training execution on faulty architectures or corrupted features."
      }
    ],
    translationKeys: [
      {
        technicalTerm: "Gradient Descent / Backprop",
        laypersonMeaning: "The step-by-step mathematical adjustment the model uses to learn from mistakes and align weights.",
        operationalMetric: "Loss reduction trajectory (should decline steadily)."
      },
      {
        technicalTerm: "Vector Embeddings",
        laypersonMeaning: "Numeric points representing how concepts relate in the model's head (e.g. concepts close together share similar meanings).",
        operationalMetric: "Similarity metrics."
      }
    ]
  };
}

function initUI() {
  // Lucide initialization
  lucide.createIcons();
}
