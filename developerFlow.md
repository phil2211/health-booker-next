# Developer Workflow for Health Booker Next

This document defines the complete workflow for implementing new features in this project, following Atlassian GitFlow best practices optimized for Next.js and Vercel deployment.

## Workflow Overview

1. **Create Feature Branch** from main
2. **Implement Feature** locally
3. **Commit and Push** to GitHub
4. **Vercel Auto-Deploys** preview environment
5. **Create Pull Request** on GitHub
6. **Wait for CI Checks** to pass
7. **Review and Test** on Vercel preview
8. **Merge to Main** after approval

---

## Step-by-Step Instructions for AI Agents

### Step 1: Create Feature Branch

**Action**: Create and switch to a new feature branch from the latest main.

**Commands:**
```bash
# Fetch latest changes from remote
git fetch origin

# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Create and switch to new feature branch
# Naming convention: feature/feature-name (lowercase, hyphen-separated)
git checkout -b feature/your-feature-name
```

**Example branch names:**
- `feature/patient-registration`
- `feature/provider-availability`
- `feature/booking-confirmation`
- `feature/email-notifications`

**Rules:**
- Always branch from `main`, never from another feature branch
- Use descriptive, kebab-case names
- Prefix with `feature/` for new functionality

---

### Step 2: Implement the Feature for the backend and the frontend. Respect the existing application structure and try to implement new features into existing structures. 

**Action**: Write code, tests, and documentation for the feature.

**Development Process:**

1. **Install dependencies** (if needed):
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Make incremental commits** with clear messages:
   ```bash
   git add <files>
   git commit -m "feat: add patient registration form"
   git commit -m "test: add tests for patient registration validation"
   ```

4. **Follow commit message conventions**:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Adding or updating tests
   - `refactor:` - Code refactoring
   - `style:` - Formatting, missing semi colons, etc
   - `chore:` - Updating build tasks, package manager configs, etc

5. **Write/update tests** as you develop:
   - Unit tests in `__tests__/` directory
   - E2E tests in `cypress/e2e/` directory
   - Run tests: `npm test` and `npm run cypress:open`

6. **Follow code quality standards**:
   - TypeScript strict mode enabled
   - ESLint rules enforced
   - Run linter: `npm run lint`

---

### Step 3: Push Branch to GitHub

**Action**: Push the feature branch to trigger Vercel preview deployment.

**Commands:**
```bash
# Push branch to remote repository
git push origin feature/your-feature-name
```

**What happens automatically:**
1. GitHub receives the push
2. Vercel detects the new branch
3. Vercel creates a preview deployment
4. Preview URL is available (e.g., `feature-your-feature-name.vercel.app`)
5. GitHub Actions CI pipeline runs

**Verify deployment:**
- Check GitHub repository → Actions tab
- Check Vercel dashboard → Deployments tab
- Preview URL will be in Vercel deployment details

---

### Step 4: Ensure CI Checks Pass

**Action**: Wait for automated quality checks to complete successfully.

**CI Pipeline runs:**
1. **ESLint** - Code linting
2. **TypeScript** - Type checking
3. **Jest Tests** - Unit/component tests
4. **Cypress E2E Tests** - End-to-end tests
5. **Build Check** - Production build verification

**Monitor CI Status:**
- View in GitHub → Your PR → Checks tab
- All checks must show green ✅ before merging
- If checks fail, fix issues and push again

**Commands** (if you need to run checks locally first):
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
npm test              # Jest tests
npm run cypress:run   # E2E tests
npm run build         # Build verification
```

---

### Step 5: Create Pull Request

**Action**: Open a Pull Request from feature branch to main.

**Process:**

1. **Go to GitHub repository**
2. **Click "New Pull Request"** or GitHub will show a banner after push
3. **Fill out the PR template:**
   - **Title**: Clear, descriptive feature name
   - **Description**: What the feature does, why it's needed
   - **Checklist**: 
     - [ ] Feature implemented and tested
     - [ ] Tests added/updated
     - [ ] Documentation updated
     - [ ] CI checks passing
     - [ ] Preview deployment working on Vercel

4. **Request reviewers** (team members who should review)
5. **Add labels** (e.g., `feature`, `frontend`, `backend`)
6. **Link related issues** using keywords: `closes #123`, `fixes #456`

**PR Title Convention:**
- `feat: Patient registration form`
- `fix: Booking time slot availability bug`
- `refactor: Extract provider availability logic`

**Example PR Description:**
```markdown
## Description
Implements patient registration functionality allowing new users to create accounts.

## Changes
- Created `/app/register/page.tsx` with registration form
- Added patient validation in `/lib/validation.ts`
- Created API endpoint `/app/api/patients/route.ts`
- Added MongoDB schema in `/models/Patient.ts`
- Added tests: `__tests__/registration.test.tsx`

## Testing
- ✅ Unit tests added and passing
- ✅ E2E test for registration flow
- ✅ Verified on Vercel preview deployment
- ✅ All CI checks passing

## Preview
https://feature-patient-registration.vercel.app
```

---

### Step 6: Test on Vercel Preview

**Action**: Verify the feature works correctly in the Vercel preview environment.

**Testing Checklist:**

1. **Access Preview URL**:
   - URL is in Vercel deployment details
   - URL is in PR description (auto-added by Vercel)
   - Format: `https://health-booker-next-git-feature-name.vercel.app`

2. **Manual Testing**:
   - Navigate through the feature
   - Test all user flows
   - Verify responsive design (mobile/tablet/desktop)
   - Check for console errors in browser DevTools
   - Test with different user roles (if applicable)

3. **Cross-browser Testing** (if critical feature):
   - Chrome
   - Firefox
   - Safari
   - Edge

4. **Performance Check**:
   - Run Lighthouse audit
   - Check page load speed
   - Verify API response times

5. **Document Test Results in PR Comments:**
   - Screenshots of feature
   - Any issues found
   - Browser compatibility notes

---

### Step 7: Address Review Feedback

**Action**: Make changes based on code review comments.

**Process:**

1. **Read Review Comments** in PR Discussion tab
2. **Discuss**: Respond to comments with questions or explanations
3. **Make Changes**: Update code based on feedback
4. **Test Locally**: Ensure changes work correctly
5. **Commit and Push**:
   ```bash
   git add <files>
   git commit -m "refactor: address PR review feedback"
   git push origin feature/your-feature-name
   ```

6. **Re-request Review** when ready (button in PR)
7. **Wait for Approvals**: At least one approval required (team policy)

---

### Step 8: Merge to Main

**Action**: Merge the approved PR into main branch.

**Prerequisites:**
- All CI checks passing ✅
- At least one approval from reviewer
- Vercel preview tested successfully
- All conversations resolved
- PR description complete

**Merge Process:**

1. **Click "Merge pull request"** button on GitHub
2. **Choose merge strategy**:
   - **"Create a merge commit"** (recommended) - preserves branch history
   - **"Squash and merge"** - combines all commits into one
   - **"Rebase and merge"** - linear history
3. **Confirm merge** - Delete branch option recommended
4. **Close related issues** if any

**After Merge:**

1. **Vercel automatically deploys to production**:
   - Detects merge to main
   - Triggers production build
   - Deploys to production URL
   - Sends notifications

2. **Update local repository**:
   ```bash
   git checkout main
   git pull origin main
   ```

3. **Verify production deployment** in Vercel dashboard

4. **Monitor** for any production issues

---

## Troubleshooting Common Issues

### CI Checks Failing

**Problem**: ESLint, TypeScript, or test failures

**Solution**:
1. Read error messages in GitHub Actions logs
2. Run checks locally: `npm run lint`, `npm test`
3. Fix issues
4. Commit and push: `git commit -m "fix: resolve linting errors"`
5. Checks re-run automatically

### Merge Conflicts

**Problem**: Feature branch conflicts with main

**Solution**:
```bash
git checkout main
git pull origin main
git checkout feature/your-feature-name
git rebase main
# Resolve conflicts
git push origin feature/your-feature-name --force-with-lease
```

### Vercel Deployment Fails

**Problem**: Build fails on Vercel

**Solution**:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Fix issues and push again

### Preview Not Working

**Problem**: Preview environment shows errors

**Solution**:
1. Check Vercel logs for server errors
2. Verify `.env.local` variables are set in Vercel dashboard
3. Check browser console for client errors
4. Test API endpoints directly

---

## Best Practices for AI Agents

### Code Quality

- **Type Safety**: Use TypeScript types for all function parameters and returns
- **Error Handling**: Wrap API calls in try-catch blocks
- **Validation**: Validate user input on both client and server
- **Comments**: Add JSDoc comments for complex functions

### Testing

- **Test Coverage**: Aim for >80% coverage for new code
- **Test Naming**: Use descriptive test names: `should display error when email is invalid`
- **Test Independence**: Tests should not depend on each other
- **E2E Tests**: Test critical user flows in Cypress

### Git Commits

- **Atomic Commits**: Each commit should be a single logical change
- **Clear Messages**: Write clear commit messages
- **Frequent Commits**: Commit every logical unit of work
- **Never Force Push to Main**: Always use `--force-with-lease` if needed

### Documentation

- **Update README**: If adding new features affecting setup
- **API Documentation**: Document new API endpoints
- **Code Comments**: Add comments for complex business logic
- **JSDoc**: Document all public functions

### Security

- **Never Commit Secrets**: Secrets go in `.env.local` (gitignored)
- **Sanitize Input**: Always sanitize user input
- **Environment Variables**: Add new variables to `.env.local.example`
- **Dependencies**: Audit with `npm audit`

---

## Workflow Summary for AI Agents

```bash
# 1. Start feature
git checkout main && git pull origin main
git checkout -b feature/your-feature

# 2. Develop and commit frequently
npm install  # if needed
npm run dev  # start development
# ... make changes ...
git add . && git commit -m "feat: description"
git push origin feature/your-feature

# 3. Run quality checks locally
npm run lint
npm run type-check
npm test
npm run cypress:run

# 4. Create PR on GitHub (manual step)

# 5. Wait for CI and approval

# 6. After merge, update local
git checkout main && git pull origin main
```

---

## Reference Links

- **Atlassian GitFlow**: https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Best Practices**: https://nextjs.org/docs/app/building-your-application/routing
- **Git Commit Messages**: https://www.conventionalcommits.org/

---

## Environment Variables Management

### Local Development
- Use `.env.local` (gitignored)
- Copy from `.env.local.example`
- Never commit `.env.local`

### Vercel Preview
- Automatically inherits from Production
- Can override per branch in Vercel dashboard
- Settings → Environment Variables

### Vercel Production
- Set in Vercel dashboard
- Go to: Project Settings → Environment Variables
- Add: `MONGODB_URI` and `MONGODB_DB`
- Deployments use these values

---

## Quick Reference Commands

```bash
# Start development
npm run dev

# Run quality checks
npm run lint && npm run type-check && npm test

# Build for production
npm run build && npm run start

# Run E2E tests
npm run cypress:open

# Git operations
git status                # Check current status
git diff                  # See changes
git log --oneline         # View commit history
git branch -a             # List all branches
```

---

This workflow ensures code quality, proper testing, and smooth deployment through the integration of GitHub, Vercel, and CI/CD pipelines.

