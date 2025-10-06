// Example service file for business logic
class ExampleService {
  constructor() {
    // Initialize service
  }

  async getAllExamples() {
    try {
      // Database operations would go here
      // For now, return mock data
      return [
        { id: 1, name: 'Example 1', status: 'active' },
        { id: 2, name: 'Example 2', status: 'inactive' }
      ];
    } catch (error) {
      throw new Error(`Failed to get examples: ${error.message}`);
    }
  }

  async createExample(data) {
    try {
      // Validation
      if (!data.name) {
        throw new Error('Name is required');
      }

      // Database operations would go here
      // For now, return mock created data
      return {
        id: Math.floor(Math.random() * 1000),
        ...data,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to create example: ${error.message}`);
    }
  }

  async getExampleById(id) {
    try {
      // Database operations would go here
      if (!id) {
        throw new Error('ID is required');
      }

      // Mock data
      return {
        id: parseInt(id),
        name: `Example ${id}`,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get example: ${error.message}`);
    }
  }
}

module.exports = new ExampleService();