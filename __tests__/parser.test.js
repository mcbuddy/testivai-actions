const parser = require('../src/parser');

describe('Parser Module', () => {
  describe('parseComment', () => {
    test('should return null for empty comment', () => {
      expect(parser.parseComment('')).toBeNull();
      expect(parser.parseComment(null)).toBeNull();
      expect(parser.parseComment(undefined)).toBeNull();
    });

    test('should return null for non-command comments', () => {
      expect(parser.parseComment('This is a regular comment')).toBeNull();
      expect(parser.parseComment('approve-visuals')).toBeNull(); // Missing slash
      expect(parser.parseComment('/approve')).toBeNull(); // Wrong command
    });

    test('should parse global approval command', () => {
      const result = parser.parseComment('/approve-visuals');
      expect(result).toEqual({
        type: 'approve',
        files: []
      });
    });

    test('should parse specific file approval command', () => {
      const result = parser.parseComment('/approve-visuals login.png');
      expect(result).toEqual({
        type: 'approve',
        files: ['login.png']
      });
    });

    test('should parse multiple file approval command', () => {
      const result = parser.parseComment('/approve-visuals login.png header.png footer.png');
      expect(result).toEqual({
        type: 'approve',
        files: ['login.png', 'header.png', 'footer.png']
      });
    });

    test('should parse rejection command', () => {
      const result = parser.parseComment('/reject-visuals profile.png');
      expect(result).toEqual({
        type: 'reject',
        files: ['profile.png']
      });
    });

    test('should handle commands with extra whitespace', () => {
      const result = parser.parseComment('  /approve-visuals   login.png   header.png  ');
      expect(result).toEqual({
        type: 'approve',
        files: ['login.png', 'header.png']
      });
    });

    test('should handle commands with path-like filenames', () => {
      const result = parser.parseComment('/approve-visuals path/to/image.png another/path/image.jpg');
      expect(result).toEqual({
        type: 'approve',
        files: ['path/to/image.png', 'another/path/image.jpg']
      });
    });
  });
});
