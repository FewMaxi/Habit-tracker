const express = require('express');
const { dbRun, dbGet, dbAll } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All habit routes require authentication
router.use(authMiddleware);

// Create habit
router.post('/', async (req, res) => {
  try {
    const { name, color, frequency, scheduledDays, showInCalendar } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ error: 'Habit name required' });
    }

    const result = await dbRun(
      `INSERT INTO habits (user_id, name, color, frequency, show_in_calendar)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name, color || '#3b82f6', frequency || 'once', showInCalendar ? 1 : 0]
    );

    const habitId = result.lastID;

    // Add scheduled days if frequency is 'specific'
    if (frequency === 'specific' && scheduledDays && scheduledDays.length > 0) {
      for (const day of scheduledDays) {
        await dbRun(
          'INSERT INTO habit_scheduled_days (habit_id, day_of_week) VALUES (?, ?)',
          [habitId, day]
        );
      }
    }

    res.status(201).json({
      message: 'Habit created',
      id: habitId,
      name,
      color,
      frequency,
      scheduledDays: scheduledDays || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all habits for user
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const habits = await dbAll(
      'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // For each habit, fetch its scheduled days
    for (let habit of habits) {
      if (habit.frequency === 'specific') {
        const days = await dbAll(
          'SELECT day_of_week FROM habit_scheduled_days WHERE habit_id = ? ORDER BY day_of_week',
          [habit.id]
        );
        habit.scheduledDays = days.map(d => d.day_of_week);
      } else {
        habit.scheduledDays = [];
      }
      // Convert boolean fields
      habit.showInCalendar = habit.show_in_calendar === 1;
    }

    res.json(habits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single habit
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const habit = await dbGet(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Get scheduled days
    if (habit.frequency === 'specific') {
      const days = await dbAll(
        'SELECT day_of_week FROM habit_scheduled_days WHERE habit_id = ? ORDER BY day_of_week',
        [habit.id]
      );
      habit.scheduledDays = days.map(d => d.day_of_week);
    } else {
      habit.scheduledDays = [];
    }
    habit.showInCalendar = habit.show_in_calendar === 1;

    res.json(habit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update habit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, color, frequency, scheduledDays, showInCalendar } = req.body;

    // Verify ownership
    const habit = await dbGet(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    // Build dynamic update query - only update provided fields
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color);
    }
    if (frequency !== undefined) {
      updateFields.push('frequency = ?');
      updateValues.push(frequency);
    }
    if (showInCalendar !== undefined) {
      updateFields.push('show_in_calendar = ?');
      updateValues.push(showInCalendar ? 1 : 0);
    }

    // Update habit only if there are fields to update
    if (updateFields.length > 0) {
      updateValues.push(id);
      updateValues.push(userId);
      const updateSQL = `UPDATE habits SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
      await dbRun(updateSQL, updateValues);
    }

    // Update scheduled days
    if (frequency === 'specific') {
      // Clear old scheduled days
      await dbRun('DELETE FROM habit_scheduled_days WHERE habit_id = ?', [id]);
      
      // Add new scheduled days
      if (scheduledDays && Array.isArray(scheduledDays) && scheduledDays.length > 0) {
        for (const day of scheduledDays) {
          await dbRun(
            'INSERT INTO habit_scheduled_days (habit_id, day_of_week) VALUES (?, ?)',
            [id, day]
          );
        }
      }
    }

    res.json({ message: 'Habit updated', id });
  } catch (err) {
    console.error('Error in PUT /habits/:id:', err.message, err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Delete habit
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verify ownership and delete
    const result = await dbRun(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
