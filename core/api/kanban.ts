import express from "express";

const router = express.Router();

// Add your kanban routes here
router.get('/', (req, res, next) => {
    try {
        res.json({ message: "Kanban API is working!" });
    } catch (error) {
        next(error);
    }
});

export default router;
