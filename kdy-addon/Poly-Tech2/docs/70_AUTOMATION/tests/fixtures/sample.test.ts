// Sample TypeScript Test File
// This fixture is used for testing routing rules

describe('Sample Test Suite', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle routing to Claude Code', () => {
    // This file should route to Claude Code per rules.yaml
    const targetAgent = 'Claude Code';
    expect(targetAgent).toBe('Claude Code');
  });
});
