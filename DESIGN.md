# AWS DevOps Incident Helper - UI/UX Design Specification & System Reference

This document defines the comprehensive user interface (UI) architecture, visual design language, component design system, interaction patterns, and page specifications for the **AWS DevOps Incident Helper**.

---

## 1. Design Philosophy & Guiding Principles

The AWS DevOps Incident Helper is tailored for cloud engineers, SREs, and DevOps professionals troubleshooting active outages and AWS infrastructure anomalies.

- **AWS Management Console Resonance**: Employs AWS's signature visual cues—Squid Ink navy (`#0b1326`, `#1e293b`), vibrant AWS orange (`#ff9900`), and clean cloud blue (`#0274bc`, `#9ccaff`)—to create an authentic, professional enterprise utility.
- **High Information Density with Low Cognitive Load**: On-call incidents demand high speed and clarity. Information is arranged in distinct, scannable cards with explicit iconography and typographic hierarchy.
- **Actionable by Default**: Every diagnostic section provides clear next steps, executable read-only AWS CLI commands, single-click copy buttons, and export options.
- **Privacy & Safety First**: Explicit visual cues (stateless pill badges, read-only tags, local-storage indicators) reassure engineers that no proprietary logs or credentials ever leave their browser or get persisted on servers.

---

## 2. Design Tokens & Visual Architecture

### 2.1 Color Palette

```css
:root {
  /* Background & Canvas */
  --background: #0b1326;                /* Deep space navy canvas */
  --surface-container-lowest: #060e20;  /* Input fills & code block backdrops */
  --surface-container-low: #131b2e;     /* Alternate section backgrounds */
  --card-bg: #1e293b;                   /* Primary container & card surface */
  --border: #31394d;                    /* Structural separation borders */
  --border-focus: #ff9900;              /* Interactive focus outline */

  /* AWS Brand & Primary Accents */
  --primary: #ff9900;                   /* Amazon Orange */
  --primary-hover: #e68a00;
  --blue: #9ccaff;                      /* Cloud Blue */
  --blue-hover: #0274bc;
  --blue-light: rgba(2, 116, 188, 0.15);

  /* Typography & Text */
  --text: #ffffff;                      /* High-emphasis text */
  --text-light: #dae2fd;                /* Secondary readable text */
  --muted: #94a3b8;                     /* Subtitles, hints, and timestamps */

  /* Semantic Status & Severities */
  --red: #ffb4ab;                       /* CRITICAL severity text */
  --red-light: rgba(147, 0, 10, 0.25);  /* CRITICAL background */
  --red-border: #93000a;
  --yellow: #f59e0b;                    /* HIGH severity text */
  --yellow-light: rgba(245, 158, 11, 0.15);
  --yellow-border: rgba(245, 158, 11, 0.3);
  --green: #10b981;                     /* LOW severity & Success */
  --green-light: rgba(16, 185, 129, 0.15);
  --green-border: rgba(16, 185, 129, 0.3);
}
```

### 2.2 Typography Scale

- **Primary Typeface**: `Inter`, system-ui, -apple-system, sans-serif
- **Monospace Typeface**: `JetBrains Mono`, ui-monospace, SFMono-Regular, Menlo, monospace
- **Iconography**: Google Material Symbols Outlined

| Token | Font Size | Weight | Line Height | Application |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | `2.5rem` (40px) | `800` | `1.15` | Hero banner titles |
| `headline-lg` | `2.0rem` (32px) | `700` | `1.25` | Page titles (`Analyzer`, `History`) |
| `headline-md` | `1.5rem` (24px) | `700` | `1.3` | Section headings |
| `headline-sm` | `1.15rem` (18.4px)| `600` | `1.4` | Card titles & modal headers |
| `body-lg` | `1.0rem` (16px) | `400` | `1.5` | Standard copy & intro paragraphs |
| `body-md` | `0.875rem` (14px) | `400` | `1.5` | Form labels, card descriptions |
| `code-mono` | `0.85rem` (13.6px)| `400` | `1.45` | AWS CLI commands, quotes, JSON |
| `badge-sm` | `0.75rem` (12px) | `700` | `1.0` | Severity tags & status pills |

### 2.3 Elevation, Shadows & Radii

```css
--radius-sm: 0.25rem;   /* 4px  - Small badges, inner buttons */
--radius-md: 0.375rem;  /* 6px  - Form inputs, code blocks */
--radius-lg: 0.5rem;    /* 8px  - Cards, modal containers */
--radius-full: 9999px;  /* Pill badges, preset chips */

--card-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2);
--card-shadow-hover: 0 12px 24px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3);
```

---

## 3. Global Navigation & Layout Shell

### 3.1 Header Navigation (`Navbar.jsx`)
- **Brand Identity**: Left-aligned AWS DevOps Incident Helper icon (`/logo-icon.png`) and title linking to `/`.
- **Navigation Links**:
  - `Home` (`/`)
  - `Analyzer` (`/analyze`)
  - `History` (`/history`) with live counter pill badge indicating saved items (`1`, `2`, ...)
  - `CLI Generator` (`/cli-generator`)
- **Active Navigation State**: Gold bottom indicator / highlighted text color (`var(--primary)`).
- **Actions Area**:
  - `Launch Analyzer →` primary CTA button.
  - Avatar placeholder indicating "Stateless Engineer Mode".
  - Mobile hamburger toggle (`material-symbols: menu / close`).

### 3.2 Global Footer (`Footer.jsx`)
- AWS Community Attribution: Built for the AWS Weekend Deployment Challenge.
- Tech Stack Legend: Amazon Bedrock (Nova Lite), AWS Lambda, API Gateway, AWS Amplify.
- Quick navigation links mirroring main routes.

---

## 4. Component Design System

### 4.1 Input Form Elements
- **Textarea Controls**:
  - Dark container fill (`rgba(11, 19, 38, 0.85)`), 1px slate border (`--border`).
  - Active focus: 3px primary glow ring (`box-shadow: 0 0 0 3px rgba(2, 116, 188, 0.25)`).
  - Bottom info bar containing live character counts (`0 / 10,000` or `0 / 20,000`) and quick "Clear" buttons.
- **Select Dropdowns**:
  - Styled custom arrow, unified padding (`10px 14px`).
- **Preset Chips (`.log-preset-chip`, `.example-chip`)**:
  - Rounded pill shape (`border-radius: 9999px`).
  - Hover micro-animation with background color transition to blue/orange tint.

### 4.2 Severity Badges & Alert Cards
Structured visual hierarchy reflecting operational urgency:

```
[CRITICAL]  Bg: rgba(147, 0, 10, 0.25)   | Border: #93000a  | Text: #ffb4ab
[HIGH]      Bg: rgba(245, 158, 11, 0.15) | Border: #f59e0b  | Text: #f59e0b
[MEDIUM]    Bg: rgba(2, 116, 188, 0.15)  | Border: #9ccaff  | Text: #9ccaff
[LOW]       Bg: rgba(16, 185, 129, 0.15) | Border: #10b981  | Text: #6ee7b7
```

### 4.3 Monospace Code Boxes & CLI Commands (`CommandList.jsx`, `CliGeneratorPage.jsx`)
- Deep black terminal canvas (`#040814`).
- Cyan command text (`#a5f3fc`) with soft word wrapping or horizontal scrollbar on overflow.
- Individual `[ Copy ]` button on the top-right of each box, changing to `Copied!` with checkmark icon for 2.5 seconds.
- Global `[ Copy All Commands ]` and `[ Download Commands ]` (`.txt` runbook generator).

### 4.4 Modals & Overlays
- Semi-transparent backdrop with blur (`backdrop-filter: blur(4px)`).
- Centered content card constrained to `850px` width and `85vh` height.
- Sticky modal header with close button (`material-symbols: close`) and Escape key event listener.

---

## 5. Page Specifications & Layout Flows

```
                          ┌───────────────────────────┐
                          │   Landing Page  ( / )     │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│  Analyzer Page      │      │  History Page       │      │  CLI Generator      │
│  ( /analyze )       │      │  ( /history )       │      │  ( /cli-generator ) │
├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
│ • Incident Tab      │      │ • Keyword Search    │      │ • 9 AWS Services    │
│ • CloudWatch Log Tab│      │ • Saved Incident Card│     │ • Read-Only Playbook│
│ • Evidence Quotes   │      │ • View Modal        │      │ • Auto Placeholders │
│ • Related Incidents │      │ • Slack/Jira Export │      │ • Runbook .txt D/L  │
└──────────┬──────────┘      └─────────────────────┘      └─────────────────────┘
           │                                                         ▲
           └───────────── [ Generate CLI Diagnostics ] ──────────────┘
```

### 5.1 Landing Page (`/`)
1. **Hero Section**:
   - Heading: *"AWS Incident Troubleshooting, Decoded by Bedrock AI"*.
   - Subtitle: Explaining rapid triage, root-cause analysis, and diagnostic CLI runbooks.
   - Live Model Badge: `Model: Amazon Nova Lite (ap-south-1)`.
   - Dual CTAs: `Launch Analyzer →` and `Generate CLI Diagnostics`.
2. **"How It Works" 3-Step Flow**:
   - Step 1: Input Error or Raw CloudWatch Logs.
   - Step 2: Bedrock Converse API Forensic Analysis.
   - Step 3: Actionable AWS CLI Remediation & Runbook Export.
3. **Features & Capabilities Grid**:
   - 6 structured cards detailing Root Cause Analysis, Forensic Log Evidence, CLI Command Generator, Incident History, Zero-Persistence Privacy, and Responsive Cloud Shell UX.
4. **Architecture Diagram Section**:
   - Visual ASCII and card rendering of browser → Amplify → API Gateway → Lambda → Bedrock.
5. **Interactive Quick-Start Scenarios**:
   - Lambda Timeout, API Gateway 502, S3 Access Denied, RDS Connection Error.

---

### 5.2 Analyzer Page (`/analyze`)

The core workspace featuring a **Dual-Tab Switcher**:

#### Tab 1: Incident Description Analyzer
- **Input**: Textarea (up to 10,000 chars) with live counter.
- **Presets**: `⚡ Lambda Timeout`, `🌐 API Gateway 502`, `🔒 S3 Access Denied`, `🖥️ EC2 Unreachable`.
- **7-Card Structured Output**:
  1. `SeverityCard`: Prominent status pill with severity definition.
  2. `Executive Summary`: High-level summary of the issue.
  3. `Likely Root Causes`: Bulleted hypotheses.
  4. `Recommended Checks`: Immediate operational inspection list.
  5. `Troubleshooting Steps`: Numbered methodical resolution steps.
  6. `Remediation`: Concrete immediate fixes.
  7. `AWS CLI Commands`: Copyable diagnostic commands.
- **Actions Toolbar**:
  - `[ Generate CLI Diagnostics ]`: Hands off context to `/cli-generator`.
  - `[ Save Incident ]`: Bookmarks into client-side history.
  - `[ Copy for Slack / Jira ]`: Copies formatted Markdown briefing.

#### Tab 2: CloudWatch Log Analyzer
- **Input**: Large textarea (up to 20,000 chars) for pasting raw multi-line logs.
- **Presets**: `⚡ Lambda Timeout`, `🌐 API Gateway 5xx`, `📦 Application Error (OOM)`, `🗄️ Database Connection Error`.
- **10-Card Structured Output**:
  1. `Severity`: `CRITICAL | HIGH | MEDIUM | LOW`.
  2. `Executive Summary`: Core log diagnosis.
  3. `Error / Failure Pattern`: Specific pattern signature (e.g. `Task timed out after 30.00 seconds`).
  4. **Evidence From Logs** (*Critical Forensic Feature*):
     - Extract verbatim log quotes into individual quote cards.
     - Pair each quote with its operational **Significance** (*"Why this log line matters"*).
  5. `Likely Root Causes`.
  6. `Recommended Diagnostic Checks`.
  7. `Troubleshooting Steps`.
  8. `Remediation`.
  9. `AWS CLI Commands`.
  10. `Prevention & Hardening`: Long-term architectural safeguards.
- **Safety Disclaimer Card**:
  - States clearly: *"Stateless & Isolated Analysis: Performed based exclusively on provided log lines. The application does not connect to or crawl your AWS account."*

#### Sub-Section: Related Saved Incidents
- Located directly below results.
- Dynamically queries `localStorage` using keyword and AWS service matching.
- Displays related incident chips with one-click view modal.
- Shows `"No related saved incidents found."` when history has no matching entries.

---

### 5.3 Incident History Page (`/history`)
- **Header**: History title, subtitle, and `100% Private (Stored Locally in Browser)` security badge.
- **Search Bar**: Real-time query input filtering across incident titles, error patterns, summaries, and severity levels.
- **Toolbar**: `New Incident` navigation and `Clear History` button.
- **Safety Confirmation Dialog**: Modal popup warning before purging all local history items.
- **Incident Cards Grid**:
  - Top: Severity badge + Type badge (`Incident` vs `Log Analysis`) + formatted timestamp.
  - Title: Incident headline.
  - Summary: 2-line truncated preview.
  - Card Actions: `[ View Analysis ]` (opens modal) and `[ Delete ]` (removes single item).
- **Empty State**: Friendly graphic and prompt: `"No saved incidents yet."` with direct CTA to Analyzer.

---

### 5.4 CLI Diagnostic Generator Page (`/cli-generator`)
- **Header**: Breadcrumbs, terminal branding icon, and `Safe Read-Only Commands` badge.
- **Diagnostic Parameters Form Card**:
  - **Quick Scenarios Bar**: Instant one-click chips for all 9 supported services.
  - **Service Selector**: Dropdown supporting `Lambda`, `API Gateway`, `S3`, `EC2`, `IAM`, `RDS`, `CloudFormation`, `CloudWatch`, `VPC / Networking`.
  - **Diagnostic Goal**: 4-row textarea with character limit (`0 / 5,000`).
  - **Resource Name**: Optional input. If left blank, standard uppercase placeholders (`FUNCTION_NAME`, `INSTANCE_ID`, `BUCKET_NAME`, etc.) are generated.
  - **Region**: Optional input (defaults to `ap-south-1`).
  - **Submit Button**: `Generate Commands` with loading spinner.
- **Diagnostic Playbook Section**:
  - **Toolbar**: Service & region labels, `[ Copy All Commands ]`, and `[ Download Commands ]` (`.txt` runbook generator).
  - **Safety Notice Banner**: Green banner verifying commands are read-only diagnostics.
  - **Diagnostic Strategy**: Paragraph card detailing what the checks will uncover.
  - **Command Inspection Cards**:
    - Index number (`#1`, `#2`).
    - `READ_ONLY` green pill.
    - Single-click `[ Copy ]` button.
    - Cyan monospace code box.
    - **What it checks** label & text.
    - **Why it is useful** label & text.

---

## 6. Responsive Layout Breakpoints

| Breakpoint | Target Devices | Layout Adjustments |
| :--- | :--- | :--- |
| **`> 1024px`** | Desktop & Large Monitors | Full 2-column forms, side-by-side buttons, multi-column cards grid |
| **`768px - 1024px`** | Tablets & Small Laptops | 2-column form rows maintained, toolbars wrap onto two lines |
| **`< 768px`** | Mobile Devices | - Navigation collapses into slide-down mobile menu<br>- Form rows stack into 1 column (`.cli-form-row`, `.log-analyzer-header`)<br>- Textareas expand to 100% width<br>- Action toolbars switch to vertical stacking<br>- Command code boxes enable horizontal swipe/scroll |

---

## 7. Accessibility (a11y) & Usability Standards

- **Semantic HTML5**: Native `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`, `<article>`.
- **Keyboard Navigation**: All interactive elements are `<button>` or `<input>` with visible focus rings (`--border-focus`).
- **ARIA Attributes**:
  - `role="tablist"`, `role="tab"`, `aria-selected` on mode switchers.
  - `role="status"` and `aria-live="polite"` on loading spinners.
  - `role="alert"` on error banners.
  - `aria-label` on icon-only and copy buttons.
- **Color Contrast**: All body text and badges exceed WCAG AA contrast ratio (minimum `4.5:1` against dark backgrounds).
- **Zero Inventions**: Placeholders (`FUNCTION_NAME`, `BUCKET_NAME`) clearly indicate user-supplied parameters to avoid accidental execution of invalid commands.

---

## 8. Export & Integration Specifications

### 8.1 Slack / Jira Markdown Format
Exported from both Incident and Log Analyzers:
```markdown
### 🚨 AWS Incident Analysis: HIGH
*Error Pattern:* **Lambda Task Timeout**

**Executive Summary:**
Lambda execution timed out after 30 seconds due to stalled downstream HTTP call.

**Evidence From Logs:**
> *Quote:* `2026-09-13T10:00:30.123Z Task timed out after 30.00 seconds`
> *Significance:* Demonstrates function reached execution timeout threshold.

**Likely Root Causes:**
- Downstream microservice latency
- Security group egress blocking VPC traffic

**Recommended Diagnostic Checks:**
- Verify downstream host latency from same subnet

**Troubleshooting Steps:**
1. Inspect CloudWatch metric Duration for p99 latency trend
2. Add explicit socket timeouts

**Remediation:**
- Increase Lambda function timeout to 60s
- Optimize downstream query

**AWS CLI Diagnostic Commands:**
```bash
aws lambda get-function-configuration --function-name payment-processor --region ap-south-1
```
---
*Generated by AWS DevOps Incident Helper (Private & Stateless)*
```

### 8.2 CLI Runbook Text Export (`.txt`)
Downloaded directly via browser Blob:
```text
==================================================
AWS DevOps Incident Helper - CLI Diagnostic Commands
==================================================
Service:     Lambda
Region:      ap-south-1
Target:      order-processor-fn
Generated:   2026-09-13T13:45:00.000Z

Summary:
Retrieves configuration and invocation metrics for order-processor-fn to isolate timeout triggers.

--------------------------------------------------
DIAGNOSTIC COMMANDS (READ-ONLY)
--------------------------------------------------

[1] aws lambda get-function-configuration --function-name order-processor-fn --region ap-south-1
    Checks:  Retrieves current function timeout, memory size, and environment variables.
    Why:     Verifies whether configured timeout is too low for downstream latency.

[2] aws logs describe-log-streams --log-group-name /aws/lambda/order-processor-fn --order-by LastEventTime --descending --region ap-south-1
    Checks:  Lists the most recent CloudWatch log streams.
    Why:     Locates execution logs for the failing invocation.

--------------------------------------------------
SAFETY NOTICE:
These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment.
The browser and assistant do not execute AWS commands directly.
==================================================
```
