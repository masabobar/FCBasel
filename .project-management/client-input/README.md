# Client Input Documents

**Purpose:** Place client-provided documents here for automatic processing into project requirements.

---

## 📂 What to Put Here

Upload any documents the client provides:

### Supported Formats:
- ✅ **PDF files** (.pdf) - Requirements documents, project briefs, specifications
- ✅ **Word documents** (.docx, .doc) - Project proposals, feature lists
- ✅ **Text files** (.txt, .md) - Notes, email content, meeting transcripts
- ✅ **Images** (.png, .jpg) - Screenshots, mockups, diagrams, wireframes

### What Documents Work Best:
- 📋 Project requirements documents
- 📝 RFPs (Request for Proposal)
- 📊 Business requirement documents
- 💡 Feature requests
- 📧 Email threads with requirements
- 🎯 Client briefs
- 📱 Mockups and wireframes
- 🗒️ Meeting notes
- 📄 Any document describing what the client wants

---

## 🚀 How to Use

### Step 1: Add Client Documents
```bash
# Copy client documents to this folder
cp /path/to/client-requirements.pdf .project-management/client-input/
cp /path/to/project-brief.docx .project-management/client-input/
cp /path/to/wireframes.png .project-management/client-input/
```

Or simply drag and drop files into this folder.

### Step 2: Run Processing Command
```bash
/process-client-docs
```

### Step 3: Review & Edit
Claude will:
1. Read all documents in this folder
2. Extract requirements, features, and goals
3. Generate/update:
   - `../input/scope.md` - Project vision, goals, objectives
   - `../input/backlog/` (modular structure) - Features and user stories
   - `../input/technologies.md` - Suggested tech stack (if mentioned)
   - `../input/constraints.md` - Timeline, budget (if mentioned)

You can then review and edit these generated files before running `/init-project`.

---

## 📝 What Claude Extracts

### From Documents → scope.md
- **Project Vision:** Overall goal and purpose
- **Target Audience:** Who will use this?
- **Core Objectives:** Main goals to achieve
- **Success Criteria:** How to measure success
- **Out of Scope:** What's NOT included
- **Assumptions & Risks:** From client notes

### From Documents → backlog.md
- **Features:** All mentioned features and functionality
- **User Stories:** Converted from requirements
- **Priorities:** Inferred from client emphasis
- **Acceptance Criteria:** Extracted from requirements
- **Dependencies:** Identified from descriptions

### From Documents → technologies.md
- **Tech Stack:** If client specifies technologies
- **Integrations:** External systems mentioned
- **Constraints:** Technology restrictions

### From Documents → constraints.md
- **Timeline:** Deadlines and milestones
- **Budget:** Cost limitations
- **Team:** Available resources
- **Compliance:** Legal/regulatory requirements

---

## 💡 Tips for Best Results

### 1. Organize Documents
```
client-input/
├── 01-project-brief.pdf          # Main project description
├── 02-requirements.docx          # Detailed requirements
├── 03-wireframes.png             # UI mockups
├── 04-timeline.txt               # Deadlines
└── 05-meeting-notes.md           # Additional context
```

Use numbered prefixes so Claude processes in order.

### 2. Include Context Documents
- Original RFP or project brief
- Meeting notes with decisions
- Email threads with clarifications
- Wireframes or mockups
- Technical constraints documents

### 3. Multiple Runs OK
You can:
- Add more documents later
- Re-run `/process-client-docs`
- Claude will merge new info with existing

### 4. Review Before Init
After processing:
1. Check `../input/scope.md` - Is vision clear?
2. Check `../input/backlog/` (modular structure) - Are features complete?
3. Edit and refine as needed
4. Then run `/init-project`

---

## 🔄 Workflow Example

**Real-world scenario:**

```bash
# 1. Client sends you documents via email
# Save them to this folder:
.project-management/client-input/
├── Client-Project-Brief.pdf
├── Feature-List.docx
├── App-Mockups.png
└── Timeline-and-Budget.txt

# 2. Run processing
/process-client-docs

# Claude analyzes all documents and generates:
# ✅ scope.md - Extracted vision, goals, objectives
# ✅ backlog.md - 25 user stories created from requirements
# ✅ technologies.md - Suggested: React, Node.js (from mockups)
# ✅ constraints.md - Deadline: 3 months, Budget: $50k

# 3. Review generated files
# Edit ../input/scope.md (add missing info)
# Edit ../input/backlog/phase-*.md (adjust priorities)

# 4. Initialize project
/init-project

# Claude generates complete documentation and Phase 1 plan
```

---

## 📋 File Naming Conventions

**Recommended naming:**
- `01-brief.pdf` - Main project brief
- `02-requirements.docx` - Detailed requirements
- `03-features.txt` - Feature list
- `04-mockups.png` - UI designs
- `05-constraints.txt` - Limitations
- `06-meeting-notes.md` - Additional context

**Why numbered?** Claude processes files alphabetically, so numbers ensure correct order.

---

## 🔍 What If Documents Are Incomplete?

Claude will:
1. Extract what it can from documents
2. Mark sections as [INCOMPLETE] or [NEEDS CLARIFICATION]
3. List questions for you to answer
4. You can then:
   - Add more documents
   - Edit input files manually
   - Re-run `/process-client-docs`

**Example output:**
```markdown
## Target Audience
[NEEDS CLARIFICATION]
Documents mention "users" but don't specify demographics.

Questions:
1. Who are the primary users? (age, role, technical level)
2. Are there different user types/personas?
3. Geographic location?
```

---

## ⚠️ Important Notes

### Data Privacy
- This folder is **gitignored** by default
- Client documents won't be committed to Git
- Keep sensitive documents secure

### Supported Languages
- Claude can read documents in multiple languages
- Best results with English, but works with others

### Large Documents
- No strict size limits
- Larger PDFs may take longer to process
- Consider splitting very large documents

### Multiple Projects
- Keep separate folders per project
- Or clear this folder between projects

---

## 🛠️ Troubleshooting

**Issue: Claude missed some requirements**
- Add more specific documents
- Re-run `/process-client-docs` (it will merge info)
- Manually edit `../input/backlog/` (modular structure) to add missing items

**Issue: Generated files are too vague**
- Provide more detailed client documents
- Add meeting notes or clarifications
- Edit generated files manually

**Issue: Wrong priorities assigned**
- Edit `../input/backlog/` (modular structure) and change P0/P1/P2 priorities
- Claude infers priorities from emphasis in documents

**Issue: Can't read a file format**
- Convert to PDF or TXT
- Copy-paste content into a .txt or .md file

---

## 📊 Success Indicators

You've got good input documents if:
- ✅ Project vision is clear
- ✅ Features are described in detail
- ✅ Target audience is specified
- ✅ Success criteria mentioned
- ✅ Timeline or deadlines included
- ✅ Budget or constraints noted

After running `/process-client-docs`, check:
- ✅ `scope.md` has complete sections
- ✅ `backlog.md` has 10+ user stories
- ✅ Priorities make sense (P0 vs P1 vs P2)
- ✅ No major [NEEDS CLARIFICATION] sections

---

## 🔄 Iterative Process

This is **iterative**:

```
Round 1:
- Add initial client documents
- Run /process-client-docs
- Review output → Identify gaps

Round 2:
- Add clarification documents (meeting notes, emails)
- Re-run /process-client-docs
- Claude merges new info with existing

Round 3:
- Manually refine scope.md and backlog.md
- Run /init-project when satisfied
```

---

## 📞 Need Help?

**If you're unsure:**
1. Add ALL documents you have
2. Run `/process-client-docs`
3. Claude will extract what it can
4. Review generated files
5. Ask Claude to clarify specific sections

**Claude can help with:**
- "Explain section X in scope.md"
- "Add more detail to user story US-005"
- "What's missing from this backlog?"
- "Generate acceptance criteria for this feature"

---

**Ready to start? Add your client documents and run `/process-client-docs`!** 🚀
