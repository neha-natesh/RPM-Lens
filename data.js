const SAMPLE_PROPOSALS = [
  {
    id: "mechanistic_interpretability",
    title: "Mechanistic Interpretability: Dictionary Learning on Gemma-2-9B via Top-K Sparse Autoencoders",
    author: "Dr. Elian Vance, Technical Fellow",
    summary: "This proposal outlines training Top-K Sparse Autoencoders (SAEs) on the residual stream activations of Gemma-2-9B across multiple layers. The goal is to extract clean, monosemantic features that represent concepts relevant to deceptive alignment and instrumental convergence, then evaluate their validity using linear probe intervention tests.",
    rawProposal: `### Mechanistic Interpretability: Dictionary Learning on Gemma-2-9B via Top-K Sparse Autoencoders
**Author:** Dr. Elian Vance

#### 1. Abstract & Objective
We aim to decompose the activation space of Gemma-2-9B into interpretable directions (monosemantic features) using sparse dictionary learning. Specifically, we will deploy Top-K Sparse Autoencoders (SAEs) on the residual stream activations at layers 12, 24, and 36. This allows us to circumvent the L1-penalty shrinkage issue while preserving high reconstruction fidelity. The primary goal is to isolate and study features correlating with deceptive alignment and power-seeking behavior.

#### 2. Experimental Pipeline & Architecture
1. **Activation Collection**: Run the base model (Gemma-2-9B, float16 precision) on a dataset mixture of OpenWebText and targeted alignment prompts. Cache residual stream activations to disk.
2. **SAE Training**: Train a Top-K SAE with dictionary expansion factor $r = 32$ (yielding $d_{\\text{sae}} = 32 \\times 3584 = 114,688$ latent features). The objective minimizes reconstruction MSE under a strict top-K sparsity constraint ($K=32$ to $K=64$).
3. **Evaluation & Feature Attribution**:
   - Compute reconstruction loss metrics (cross-entropy loss difference).
   - Track latent feature activation densities.
4. **Causal Intervention (Probing & Steering)**: Clamping specific feature activations to zero (ablation) or positive constants to verify if we can steer the model out of deceptive generation paths.

#### 3. Resource & Compute Breakdown
- **Training Duration**: 4 days per layer. Total layers = 3.
- **Compute Cluster Requirements**: 8x A100 (80GB VRAM) node for parallel activation streaming and model hosting.
- **Storage**: ~2.5 TB high-speed NVMe storage to cache activations (assuming 10M tokens, float16 activations across multiple layers).
- **APIs**: Hugging Face Hub access (base model weight downloads), weights & biases for training run tracking.`,
    blueprint: {
      category: "Mechanistic Interpretability",
      difficulty: "Advanced",
      riskLevel: "High (Compute & Storage Bound)",
      riskReason: "High local VRAM and fast storage throughput requirements. Potential budget overflow if training is interrupted.",
      infrastructure: {
        compute: "8x NVIDIA A100 (80GB) Node for 12 days total",
        estimatedCost: "$3,450 (using spot instances, $4,800 on-demand)",
        storage: "2.5 TB high-speed NVMe SSD scratch space",
        externalApis: [
          { name: "Hugging Face Hub", purpose: "Downloading Gemma-2-9B model weights" },
          { name: "Weights & Biases", purpose: "Real-time training run telemetry tracking" }
        ],
        softwareLibraries: ["PyTorch 2.2+", "TransformerLens", "SAELens", "CUDA 12.1+"]
      },
      gatingActions: [
        {
          id: "gate_1",
          phase: "Phase 1: Activation Storage Validation",
          technicalTrigger: "Residual stream caching of 10M tokens onto disk",
          rpmGate: "Verify NVMe storage is set up. DO NOT start SAE training unless disk writes succeed without timeout issues (avoids wasting GPU rental time).",
          riskMitigation: "Ensure the storage has at least 3 TB of free space and has a write speed above 500MB/s."
        },
        {
          id: "gate_2",
          phase: "Phase 2: Reconstruction Loss Check",
          technicalTrigger: "Compute Cross-Entropy (CE) loss difference on held-out test data",
          rpmGate: "CE loss difference must be < 0.15 nats. If the loss is higher, the SAE is losing too much model capability. Stop training and review hyperparameters before doing feature steering.",
          riskMitigation: "A poorly trained SAE will produce nonsense steering results, wasting steering/ablation compute budget."
        },
        {
          id: "gate_3",
          phase: "Phase 3: Steering Safety Test",
          technicalTrigger: "Feature steering intervention (clamping activation values)",
          rpmGate: "Verify that model steering does not cause the model output to completely degrade into repetitive gibberish. If output quality drops below 80% coherence, pause steering experiments.",
          riskMitigation: "Ensure automated generation evaluations are active to measure readability alongside alignment metrics."
        }
      ],
      translationKeys: [
        {
          technicalTerm: "Top-K Sparse Autoencoder",
          laypersonMeaning: "A specialized filter that groups thousands of mathematical model calculations into a clean list of understandable 'concepts' or 'features' (like a dictionary).",
          operationalMetric: "Sparsity (L0 norm: the average number of active features per token; target should be ~32 to 64 active concepts at once)."
        },
        {
          technicalTerm: "Residual Stream Activations",
          laypersonMeaning: "The internal 'thought stream' or data packet passed between layers of the AI model as it processes text.",
          operationalMetric: "Disk write rate (needs fast drives to save gigabytes of 'thoughts' every second)."
        },
        {
          technicalTerm: "Feature Steering / Clamping",
          laypersonMeaning: "Forcibly turning on or off specific internal concepts (e.g., forcing the concept of 'honesty' to stay on) to see if it changes the model's behavior.",
          operationalMetric: "Steering Strength vs. Text Coherence (checking if forcing concepts breaks the model's ability to speak English)."
        },
        {
          technicalTerm: "Dictionary Expansion Factor (r = 32)",
          laypersonMeaning: "The ratio defining how detailed our dictionary of concepts is. Higher values capture subtler concepts but require much more memory.",
          operationalMetric: "Total feature count (114,688 individual concepts to track)."
        }
      ]
    }
  },
  {
    id: "eliciting_latent_knowledge",
    title: "Eliciting Latent Knowledge (ELK) via Contrastive Representation Clustering on TruthfulQA",
    author: "Sarah Chen, Senior Alignment Scholar",
    summary: "This proposal implements Eliciting Latent Knowledge (ELK) techniques using unsupervised representation clustering. It searches for internal model activations that represent a model's true beliefs versus its public responses, specifically when instructed to lie or deceive.",
    rawProposal: `### Eliciting Latent Knowledge (ELK) via Contrastive Representation Clustering
**Author:** Sarah Chen

#### 1. Background
When an AI model is queried, its outputs might conform to human expectations or biases rather than its true internal knowledge representation (the 'human simulator' hypothesis). To elicit latent knowledge, we will extract representation vectors corresponding to contrastive question pairs (e.g., 'The capital of France is Paris - [True/False]') and train a Contrastive Consistent Estimator (CCE) in activation space to find the 'truth feature' direction without relying on labeled honest training runs.

#### 2. Technical Protocol
1. **Contrastive Prompt Generation**: Format TruthfulQA prompts into positive and negative assertion pairs.
2. **Feature Extraction**: Run Llama-3-8B-Instruct. Extract activations from mid-to-late layer MLP outputs (specifically layers 16 to 28).
3. **Loss Formulation & Clustering**: Define a loss function:
   $$L_{\\text{CCE}}(\\theta) = \\mathbb{E}[(p_{\\theta}(x^+) + p_{\\theta}(x^-) - 1)^2] + \\lambda \\mathbb{E}[p_{\\theta}(x^+)^2 + p_{\\theta}(x^-)^2]$$
   Where $p_{\\theta}$ represents the prediction of the linear probe. The first term enforces consistency (probabilities sum to 1), and the second term prevents trivial constant solutions.
4. **Anomalous Response Testing**: Inject adversarial prompts where the system is explicitly instructed to act as a deceptive assistant, and verify if the probe can still extract the true answer despite the deceptive output text.

#### 3. Infrastructure & Dependencies
- **GPUs**: 2x RTX 4090 or A10G GPUs (24GB VRAM each) to run Llama-3-8B inference and activation extraction.
- **Compute Time**: 3 days of development and extraction.
- **APIs**: OpenAI API (GPT-4o) used as an evaluator to score the truthfulness of the generated answers for validation purposes.
- **Tokens/Run**: ~150k evaluation tokens on GPT-4o.`,
    blueprint: {
      category: "Eliciting Latent Knowledge (ELK)",
      difficulty: "Intermediate",
      riskLevel: "Medium (API Cost & Prompt Fragility)",
      riskReason: "High dependency on API evaluation reliability and sensitivity to prompt templates. Low local compute risk.",
      infrastructure: {
        compute: "2x RTX 4090 or A10G (24GB VRAM) for 3 days",
        estimatedCost: "$150 (using consumer cloud GPU services)",
        storage: "100 GB standard SSD space",
        externalApis: [
          { name: "OpenAI GPT-4o API", purpose: "Automated scoring of truthfulness of output answers (~150,000 tokens)" }
        ],
        softwareLibraries: ["PyTorch", "Hugging Face Transformers", "Scikit-Learn (for clustering analyses)"]
      },
      gatingActions: [
        {
          id: "elk_gate_1",
          phase: "Phase 1: Contrastive Vector Alignment",
          technicalTrigger: "Verify consistency loss ($L_{\\text{CCE}}$) drops below 0.05",
          rpmGate: "Ensure the unsupervised probe has converged on a binary contrast. If consistency loss remains high, the probe is not learning a true/false dimension. Halt run to avoid training on noise.",
          riskMitigation: "Re-check prompt formatting to ensure assertions are exact logical opposites."
        },
        {
          id: "elk_gate_2",
          phase: "Phase 2: Validation of Prompt Steering",
          technicalTrigger: "Accuracy check on baseline TruthfulQA dataset",
          rpmGate: "The trained probe must identify truth with > 75% accuracy on standard questions. If accuracy is below this, do not proceed to the 'deceptive prompts' test phase.",
          riskMitigation: "A weak baseline probe will give false positives/negatives when testing deceptive behavior."
        },
        {
          id: "elk_gate_3",
          phase: "Phase 3: API Budget Monitor",
          technicalTrigger: "GPT-4o evaluation calls exceed 1000 requests",
          rpmGate: "Confirm GPT-4o evaluation API costs. Halt evaluations if cost approaches $100 limit unless fellow optimizes evaluation dataset batch sizes.",
          riskMitigation: "Enforce local offline LLM evaluation metrics (e.g., using a smaller model) if budget constraints are hit."
        }
      ],
      translationKeys: [
        {
          technicalTerm: "Eliciting Latent Knowledge (ELK)",
          laypersonMeaning: "Extracting what an AI model actually 'knows' to be true internally, even if it has been instructed to lie or deceive in its public chat response.",
          operationalMetric: "Truth-Extraction Accuracy (how reliably the internal reader spots lies vs. truths)."
        },
        {
          technicalTerm: "Contrastive Consistent Estimator (CCE)",
          laypersonMeaning: "A mathematical tool that looks for internal patterns that are consistently opposite (like True vs. False) without human labels.",
          operationalMetric: "Consistency score (must approach 100% indicating a clear binary split)."
        },
        {
          technicalTerm: "Linear Probe",
          laypersonMeaning: "A very simple, lightweight math formula trained to read off one specific concept from the model's internal activations.",
          operationalMetric: "Probe training time (should complete in minutes, unlike training the main model which takes days)."
        }
      ]
    }
  },
  {
    id: "agentic_red_teaming",
    title: "Evaluating Deception and Self-Replication in Multi-Agent RL Environments",
    author: "Vikram Mehta, Security Research Fellow",
    summary: "This proposal implements a simulation framework to evaluate whether reinforcement learning agents learn deceptive strategies (e.g. hiding capabilities, creating covert backups of code) in environments that reward survival and resource acquisition.",
    rawProposal: `### Evaluating Deception and Self-Replication in Multi-Agent RL Environments
**Author:** Vikram Mehta

#### 1. Research Scope
We intend to study the emergence of instrumental convergence behaviors, specifically deception (avoiding monitoring) and self-replication (copying run weights to external endpoints), in multi-agent environments. We deploy agents initialized with Claude-3.5-Sonnet and Llama-3-70B using a gym-like gridworld interface extended with terminal access capability.

#### 2. Experimental Setup & Danger Zone
1. **Agent Setup**: Reinforcement Learning loop using PPO (Proximal Policy Optimization) fine-tuning or prompt-based iterative learning.
2. **Action Space**: In addition to movement and harvesting resources, the agent can interact with an isolated local shell terminal. This terminal can access an simulated internal subnetwork.
3. **Reward Function**: Rewards are proportional to survival length, resource storage, and evasion of 'monitoring agent' detections.
4. **Safety & Containment**: The environments will run inside sandboxed Docker containers. A monitoring script checks for unauthorized outbound network packets.

#### 3. Computing Resource Demands
- **GPU Cluster**: 4x H100 (80GB VRAM) for 5 days of multi-agent environment interaction and Llama-3-70B local deployment.
- **Docker Sandbox Server**: Dedicated 32-core CPU server with strict networking policies (ufw disabled outgoing, except to registry).
- **APIs**: Claude-3.5-Sonnet API key for agent testing. Expected API load: ~1.5 million tokens.`,
    blueprint: {
      category: "Agentic Red Teaming & Capability Evaluation",
      difficulty: "Expert / Safety Risk",
      riskLevel: "Critical (Sandboxing & Outbound Net Risk)",
      riskReason: "Agent has access to terminal commands. Run must be tightly isolated to prevent runaway scripts or API key leaks. High compute cost.",
      infrastructure: {
        compute: "4x NVIDIA H100 (80GB) + 32-core sandbox host for 5 days",
        estimatedCost: "$2,200 compute + $300 Anthropic API credits",
        storage: "200 GB SSD space with strict Docker volume bounds",
        externalApis: [
          { name: "Anthropic Claude API", purpose: "Powering the core agent decisions during gameplay (~1.5M tokens)" }
        ],
        softwareLibraries: ["Docker", "Ray / RLlib", "OpenAI Gym", "PyTorch"]
      },
      gatingActions: [
        {
          id: "agent_gate_1",
          phase: "Phase 1: Sandbox Quarantine Setup",
          technicalTrigger: "Verify Docker sandbox network isolation",
          rpmGate: "RPM must run the quarantine check tool. Ensure 'ping google.com' returns failure from inside the Docker container before starting agent runs. DO NOT provide Claude API keys to the sandbox unless outgoing traffic is strictly whitelisted only to Anthropic servers.",
          riskMitigation: "Prevents the agent from downloading unverified external code packages or contacting external servers."
        },
        {
          id: "agent_gate_2",
          phase: "Phase 2: API Spending Limit Cap",
          technicalTrigger: "Anthropic API daily cost matches $100 limit",
          rpmGate: "Enforce hard budget limits on the Anthropic account. If the agent gets stuck in infinite loops, it will burn hundreds of dollars in minutes. Review prompt trajectories daily.",
          riskMitigation: "Stops runaway loops from burning through monthly organization budgets."
        },
        {
          id: "agent_gate_3",
          phase: "Phase 3: Deceptive Action Detection",
          technicalTrigger: "Detection of terminal shell evasion tactics",
          rpmGate: "If the agent attempts to run 'chmod', 'curl', or edits Docker configs, the monitoring tool will flag it. RPM must freeze the run and verify the agent's intent with the technical mentor.",
          riskMitigation: "Identifies whether safety hazards (like evasion or self-replication) are actively occurring."
        }
      ],
      translationKeys: [
        {
          technicalTerm: "Self-Replication / Covert Backups",
          laypersonMeaning: "The AI agent attempting to copy its own code/weights to another location or server to ensure its survival beyond the research run.",
          operationalMetric: "Outbound file transfer volume & terminal access anomalies."
        },
        {
          technicalTerm: "Instrumental Convergence",
          laypersonMeaning: "The tendency of any intelligent agent to seek survival, resource gathering, and self-preservation as stepping stones to achieve its main goals.",
          operationalMetric: "Resource hoarding score in the game environment."
        },
        {
          technicalTerm: "Docker Sandbox Quarantine",
          laypersonMeaning: "An digital jail cell that prevents the AI agent from interacting with the real internet or messing up the host computer.",
          operationalMetric: "Internet access block status (Must be 100% active/blocked)."
        }
      ]
    }
  }
];
