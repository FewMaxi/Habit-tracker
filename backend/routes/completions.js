const express = require('express');
const { dbRun, dbGet, dbAll } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Mark habit as complete on a specific date
router.post('/complete', async (req, res) => {
  try {
    const { habitId, date } = req.body;
    const userId = req.userId;

    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date required' });
    }

    // Verify habit belongs to user
    const habit = await dbGet(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [habitId, userId]
    );
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Insert or replace completion
    try {
      await dbRun(
        `INSERT INTO habit_completions (user_id, habit_id, completed_date)
         VALUES (?, ?, ?)`,
        [userId, habitId, date]
      );
    } catch (err) {
      // If unique constraint fails, it's already marked as complete
      if (!err.message.includes('UNIQUE')) throw err;
    }

    res.json({ message: 'Habit marked as complete', habitId, date });
  } catch (err) {
    console.error('Error in POST /completions/complete:', err.message, err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Unmark habit as complete
router.post('/uncomplete', async (req, res) => {
  try {
    const { habitId, date } = req.body;
    const userId = req.userId;

    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date required' });
    }

    await dbRun(
      'DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_date = ?',
      [habitId, userId, date]
    );

    // Update daily summary
    await dbRun(
      `UPDATE daily_summaries SET completed_habits = MAX(0, completed_habits - 1)
       WHERE user_id = ? AND date = ?`,
      [userId, date]
    );

    res.json({ message: 'Habit unmarked', habitId, date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get completions for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.userId;

    const completions = await dbAll(
      'SELECT habit_id FROM habit_completions WHERE user_id = ? AND completed_date = ?',
      [userId, date]
    );

    res.json({
      date,
      completedHabitIds: completions.map(c => c.habit_id)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get completions for a date range (for calendar)
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }

    const completions = await dbAll(
      `SELECT completed_date, COUNT(*) as completed_count
       FROM habit_completions
       WHERE user_id = ? AND completed_date BETWEEN ? AND ?
       GROUP BY completed_date`,
      [userId, startDate, endDate]
    );

    res.json({
      startDate,
      endDate,
      completions: completions.reduce((acc, c) => {
        acc[c.completed_date] = c.completed_count;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get history summary
router.get('/history/summary', async (req, res) => {
  try {
    const userId = req.userId;

    const summaries = await dbAll(
      'SELECT * FROM daily_summaries WHERE user_id = ? ORDER BY date DESC LIMIT 90',
      [userId]
    );

    res.json(summaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
