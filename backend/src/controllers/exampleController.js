// Example controller file
const exampleController = {
  // GET /api/example
  getExample: async (req, res) => {
    try {
      // Business logic here
      res.status(200).json({
        message: 'Example controller method',
        data: { example: true }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  },

  // POST /api/example
  createExample: async (req, res) => {
    try {
      const { data } = req.body;
      
      // Validation and business logic here
      if (!data) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Data is required'
        });
      }

      res.status(201).json({
        message: 'Example created successfully',
        data: { id: 1, ...data }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
};

module.exports = exampleController;