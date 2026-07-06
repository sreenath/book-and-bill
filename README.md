# Book&Bill

A base ReAct agent built with Google's Agent Development Kit (ADK) for managing salon bookings and generating invoices.
Agent generated with Agents CLI version `0.5.1`

## Project Structure

This project is organized as follows:

```
book-and-bill/
├── .agents/             # Behavioral rules for the AI pair-programmer
├── app/                 # Core application code
│   ├── agent.ts         # Main orchestrator, multi-agent setup, and guidelines
│   ├── scheduler.ts     # Database helpers (appointments, invoices, quotes)
│   ├── model-factory.ts # Dynamic model selection factory (Gemini, Groq, OpenAI)
│   ├── config/          # Multi-tenant business configs & scheduling validation
│   ├── models/          # Custom connection adapters (OpenAI, Groq)
│   └── tools/           # Custom FunctionTools (booking, cancellation, billing, PDF generation)
├── data/                # File-based database stores (appointments, invoices, quotes)
├── deployment/          # Terraform infrastructure configurations
├── specs/               # Project specification documentation
├── tests/               # Integration tests
├── Makefile             # Automation commands (alternative to npm scripts)
├── README.md            # Main project documentation
├── package.json         # Project configuration and dependencies
└── vitest.config.ts     # Unit testing configuration
```

> 💡 **Tip:** Use [Gemini CLI](https://github.com/google-gemini/gemini-cli) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **Node.js 20+**: JavaScript runtime (used for all dependencies in this project) - [Install](https://nodejs.org/)
- **npm**: Node package manager (comes with Node.js) - add packages with `npm install <package>`
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)
- **Terraform**: For infrastructure deployment - [Install](https://developer.hashicorp.com/terraform/downloads)


## Quick Start (Local Testing)

1. Create your environment file from the example:

```bash
cp .env.example .env
```

2. Edit `.env` with your configuration. Refer to [.env.example](file:///c:/PythonProjects/appointment-scheduler/.env.example) for all available options:

```bash
# Example: Using the Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

3. Install and launch:

```bash
npm install && npm run dev
```

### Integration with Agent Host App

If you want to run this agent along with the [agent-host-app](https://github.com/sreenath/agent-host-app), start the local API server with allowed CORS origins:

```bash
# Build the agent
npm run build

# Start the API server allowing origins from the host app
npx @google/adk-devtools api_server -h localhost --port 8000 --allow_origins "*" dist/book_and_bill_agent.js
```

> **📊 Observability Note:** Agent telemetry (Cloud Trace) is always enabled. Prompt-response logging (GCS, BigQuery, Cloud Logging) is **disabled** locally, **enabled by default** in deployed environments (metadata only - no prompts/responses). See [Monitoring and Observability](#monitoring-and-observability) for details.

## LLM Configuration & Dynamic Switching

Book&Bill supports multiple LLM providers dynamically at startup based on the presence of API keys in the environment. The dynamic model selection factory (`app/model-factory.ts`) resolves the model to use in the following order of precedence:

1. **Gemini** (Recommended): Triggered if `GEMINI_API_KEY` or `GOOGLE_GENAI_API_KEY` is present.
   - Configure the model version with `GEMINI_MODEL` (default: `gemini-2.5-flash`).
2. **Groq**: Triggered if `GROQ_API_KEY` is present (and Gemini keys are absent).
   - Configure the model version with `GROQ_MODEL` (default: `llama-3.3-70b-versatile`). A custom adapter (`app/models/groq.ts`) translates ADK types to and from the Groq API.
3. **OpenAI**: Triggered if `OPENAI_API_KEY` is present (and Gemini/Groq keys are absent).
   - Configure the model version with `OPENAI_MODEL` (default: `gpt-4o-mini`). A custom adapter (`app/models/openai.ts`) translates ADK types to and from the OpenAI API.
4. **Ollama**: Triggered if `OLLAMA_MODEL` is set (with `OLLAMA_API_URL` pointing to the local runner). Uses the OpenAI client adapter to talk to the local service.

## Commands

The project provides npm scripts for common tasks:

| Command             | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `npm install`       | Install all required dependencies                                                           |
| `npm run dev`       | Launch local development environment (playground) with backend and frontend                 |
| `npm run build`     | Build TypeScript to JavaScript                                                              |
| `npm run test`      | Run all unit and integration tests using vitest                                             |
| `npm run test:unit` | Run unit tests only                                                                         |
| `npm run lint`      | Run code quality checks using eslint                                                        |
| `npm run typecheck` | Run TypeScript type checking                                                                |

Alternatively, refer to the [Makefile](Makefile) for automation commands.


## Usage

This template follows a "bring your own agent" approach - you focus on your business logic, and the template handles everything else (UI, infrastructure, deployment, monitoring).
1. **Prototype:** Build your Generative AI Agent using the intro notebooks in `notebooks/` for guidance. Use Vertex AI Evaluation to assess performance.
2. **Integrate:** Import your agent into the app by editing `app/agent.ts`. Add tools using `FunctionTool` with Zod schemas for parameter validation.
3. **Test:** Explore your agent functionality using the local playground with `npm run dev`. The playground automatically reloads your agent on code changes.
4. **Deploy:** Set up and initiate the CI/CD pipelines, customizing tests as necessary. Refer to the [deployment section](#deployment) for comprehensive instructions. For streamlined infrastructure deployment, simply run `uvx google-agents-cli infra cicd`. Currently supports GitHub with both Google Cloud Build and GitHub Actions as CI/CD runners.
5. **Monitor:** Track performance and gather insights using BigQuery telemetry data, Cloud Logging, and Cloud Trace to iterate on your application.

The project includes a `GEMINI.md` file that provides context for AI tools like Gemini CLI when asking questions about your template.


## Deployment

> **Note:** For a streamlined one-command deployment of the entire CI/CD pipeline and infrastructure using Terraform, you can use the `agents-cli infra cicd` CLI command. Currently supports GitHub with both Google Cloud Build and GitHub Actions as CI/CD runners.

### Dev Environment

You can test deployment towards a Dev Environment using the following command:

```bash
gcloud config set project <your-dev-project-id>

# Build the project
npm run build

# Deploy to Cloud Run
gcloud beta run deploy book-and-bill \
  --source . \
  --memory "4Gi" \
  --region "us-east1" \
  --no-allow-unauthenticated \
  --no-cpu-throttling \
  --labels "created-by=adk" \
  --update-env-vars "GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_LOCATION=global"
```


The repository includes a Terraform configuration for the setup of the Dev Google Cloud project.

### Production Deployment

The repository includes a Terraform configuration for the setup of a production Google Cloud project.

## Monitoring and Observability

The application provides two levels of observability:

**1. Agent Telemetry Events (Always Enabled)**
- OpenTelemetry traces and spans exported to **Cloud Trace**
- Tracks agent execution, latency, and system metrics

**2. Prompt-Response Logging (Configurable)**
- GenAI instrumentation captures LLM interactions (tokens, model, timing)
- Exported to **Google Cloud Storage** (JSONL), **BigQuery** (external tables), and **Cloud Logging** (dedicated bucket)

| Environment | Prompt-Response Logging |
|-------------|-------------------------|
| **Local Development** (`npm run dev`) | ❌ Disabled by default |
| **Deployed Environments** (via Terraform) | ✅ **Enabled by default** (privacy-preserving: metadata only, no prompts/responses) |

**To enable locally:** Set `LOGS_BUCKET_NAME` and `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT`.

**To disable in deployments:** Edit Terraform config to set `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=false`.

Refer to the Cloud Trace and BigQuery documentation for detailed instructions, example queries, and visualization options.
