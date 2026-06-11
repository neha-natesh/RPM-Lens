# RPM-Lens 

**RPM-Lens** is a highly focused visual pipeline utility designed for **Research Project Managers (RPMs)** at AI safety research institutes created using Google Anti-gravity as a prototype for work task. Since RPMs are often non-technical, they need a simple way to quickly evaluate the operational risks, compute budgets, and safety requirements of highly technical proposals without having to read dense code or mathematical proofs.

RPM-Lens translates complex, jargon-heavy technical proposals into structured, non-technical **Project Blueprints**.

---

## Key Features

1. **Structured Infrastructure Blueprints**:
   - Outlines total GPU compute setups (e.g., A100 vs H100 GPU hours required).
   - Maps storage requirements and software dependencies (e.g., PyTorch, TransformerLens, Docker).
   - Tracks external API key requirements (e.g., Anthropic Claude, OpenAI GPT-4o) so budgets can be allocated appropriately.

2. **Timeline Dependencies & Action Gates**:
   - Visualizes sequential project milestones.
   - Highlights explicit **RPM Gates** where resources or permissions must be approved before moving to the next stage (e.g., verifying network sandbox isolation before supplying an API key to an agent).

3. **Non-Technical Jargon Directory**:
   - A direct dictionary translating complex terms (e.g., *Top-K Sparse Autoencoders*, *Contrastive Consistent Estimators*) into simple layperson explanations.
   - Highlights operational metrics the RPM should track to confirm successful execution.

4. **Live Cost Sandbox**:
   - Interactive sliders to dynamically recalculate hosting and execution budgets based on cluster hourly rates and run durations.

5. **Dynamic LLM Parsing (Optional)**:
   - Paste custom research proposals and configure Gemini, OpenAI, or Anthropic API keys directly inside the client to generate custom blueprints on-the-fly.
   - Features a robust keyword-based local parser for offline use.

---

## Project Structure

- `index.html` - Premium responsive glassmorphic dashboard container.
- `style.css` - Custom styling theme (indigo, violet, emerald accents) with print-friendly layout support.
- `data.js` - Preloaded proposals representing real safety domains (Interpretability, ELK, Agentic evaluations).
- `app.js` - Logic controller, interactive sliders, and client-side LLM API integrations.

---

## Getting Started

### Quick Start (Local Browser)
You do not need any backend setup. Simply open `index.html` directly in any web browser.

### Local Development Server
To serve files via a local server (recommended to avoid CORS restrictions when using API keys):

```bash
# Using Python
python -m http.server 8000

# Using Node (if installed)
npx serve .
```
Open your browser and navigate to `http://localhost:8000`.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
