# Integration Testing Guide for TestivAI Visual Regression Approval Action

This guide outlines the steps to perform integration testing of the TestivAI Visual Regression Approval Action in a real GitHub repository.

## Prerequisites

- A GitHub repository with TestivAI visual regression testing set up
- Admin access to the repository to configure workflows
- Some visual regression diffs to test with

## Setup Steps

### 1. Add the Workflow File

Create a `.github/workflows/testivai-approve.yml` file in your test repository:

```yaml
name: TestivAI Visual Regression Approval

on:
  issue_comment:
    types: [created]

jobs:
  process-approval:
    runs-on: ubuntu-latest
    # Only run on PR comments that contain the approval commands
    if: |
      github.event.issue.pull_request &&
      (contains(github.event.comment.body, '/approve-visuals') || 
       contains(github.event.comment.body, '/reject-visuals'))
    
    permissions:
      contents: write  # Needed to push changes back to the branch
      pull-requests: write  # Needed to comment on PRs
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0
      
      - name: Process visual approval/rejection
        uses: testivai/visual-approval-action@v1
        id: visual-approval
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Comment on PR with results
        if: always()
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const result = ${{ steps.visual-approval.outputs.result }};
            const approvedFiles = ${{ steps.visual-approval.outputs.approved-files || '[]' }};
            const rejectedFiles = ${{ steps.visual-approval.outputs.rejected-files || '[]' }};
            
            let message = '';
            
            if (result === 'success') {
              message = '✅ Visual regression changes processed successfully!\n\n';
              
              if (approvedFiles.length > 0) {
                message += '**Approved files:**\n';
                approvedFiles.forEach(file => {
                  message += `- ${file}\n`;
                });
                message += '\n';
              }
              
              if (rejectedFiles.length > 0) {
                message += '**Rejected files:**\n';
                rejectedFiles.forEach(file => {
                  message += `- ${file}\n`;
                });
                message += '\n';
              }
            } else {
              message = '❌ Failed to process visual regression changes. Please check the action logs for details.';
            }
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: message
            });
```

### 2. Create a Test PR

1. Create a new branch in your repository
2. Make some UI changes that will trigger visual regression diffs
3. Create a pull request for these changes
4. Run your TestivAI visual regression tests on this PR

### 3. Test Approval Commands

Test the following scenarios:

#### Global Approval

Comment on the PR with:
```
/approve-visuals
```

Expected outcome:
- The action should run and approve all visual regression diffs
- The approvals.json file should be updated with all diffs marked as approved
- The baseline images should be updated
- A comment should be added to the PR with the results

#### Specific File Approval

Comment on the PR with:
```
/approve-visuals header.png
```

Expected outcome:
- The action should run and approve only the specified file
- The approvals.json file should be updated with only the specified file marked as approved
- The baseline image for the specified file should be updated
- A comment should be added to the PR with the results

#### Multiple File Approval

Comment on the PR with:
```
/approve-visuals header.png footer.png
```

Expected outcome:
- The action should run and approve both specified files
- The approvals.json file should be updated with both files marked as approved
- The baseline images for both files should be updated
- A comment should be added to the PR with the results

#### File Rejection

Comment on the PR with:
```
/reject-visuals settings.png
```

Expected outcome:
- The action should run and reject the specified file
- The approvals.json file should be updated with the specified file marked as rejected
- No baseline images should be updated for rejected files
- A comment should be added to the PR with the results

## Verification Checklist

For each test scenario, verify:

- [ ] The action runs successfully
- [ ] The approvals.json file is updated correctly
- [ ] The baseline images are updated as expected
- [ ] The PR comment is added with the correct information
- [ ] The commit is made with the correct author information

## Error Scenarios to Test

Also test the following error scenarios:

1. **Invalid file name**: Comment with a file that doesn't exist
2. **Permission issues**: Temporarily restrict permissions and test
3. **Missing TestivAI CLI**: Temporarily remove TestivAI CLI and test
4. **Malformed comment**: Test with slightly incorrect command format

## Reporting Issues

If you encounter any issues during integration testing:

1. Check the action logs for detailed error messages
2. Verify your TestivAI setup is correct
3. Open an issue on the GitHub repository with details about the problem
