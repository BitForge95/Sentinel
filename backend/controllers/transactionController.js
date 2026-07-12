function generateMockTransaction(req,res) {
    res.status(200).json({ message: "Mock transaction endpoint"});
}

module.exports = {generateMockTransaction};