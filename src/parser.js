/**
 * Parser module for handling PR comment parsing
 */

/**
 * Parse a PR comment to extract approval/rejection commands
 * 
 * @param {string} commentBody - The body of the PR comment
 * @returns {Object|null} - Command object or null if no valid command found
 */
function parseComment(commentBody) {
  if (!commentBody) {
    return null;
  }

  // Normalize comment by trimming and converting to lowercase for easier matching
  const normalizedComment = commentBody.trim();
  
  // Check for approval command
  if (normalizedComment.startsWith('/approve-visuals')) {
    return parseApprovalCommand(normalizedComment);
  }
  
  // Check for rejection command
  if (normalizedComment.startsWith('/reject-visuals')) {
    return parseRejectionCommand(normalizedComment);
  }
  
  // No valid command found
  return null;
}

/**
 * Parse an approval command
 * 
 * @param {string} command - The approval command
 * @returns {Object} - Command object with type and files
 */
function parseApprovalCommand(command) {
  return {
    type: 'approve',
    files: extractFileNames(command, '/approve-visuals')
  };
}

/**
 * Parse a rejection command
 * 
 * @param {string} command - The rejection command
 * @returns {Object} - Command object with type and files
 */
function parseRejectionCommand(command) {
  return {
    type: 'reject',
    files: extractFileNames(command, '/reject-visuals')
  };
}

/**
 * Extract file names from a command
 * 
 * @param {string} command - The full command
 * @param {string} prefix - The command prefix to remove
 * @returns {string[]} - Array of file names (empty if global command)
 */
function extractFileNames(command, prefix) {
  // Remove the command prefix
  const filesPart = command.substring(prefix.length).trim();
  
  // If there's nothing after the command, it's a global command
  if (!filesPart) {
    return [];
  }
  
  // Split by whitespace and filter out empty strings
  return filesPart.split(/\s+/).filter(Boolean);
}

module.exports = {
  parseComment
};
