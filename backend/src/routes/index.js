import express from 'express';
const router = express.Router();

// Health check / root route
router.get('/', (req, res) =>{
<<<<<<< HEAD
    res.json({ message: 'API is running on Render.com' });
=======
    res.json({ message: 'API is running' });
>>>>>>> 272ee2693445b70699169ced8c99b1e27478756c
});



export default router;
