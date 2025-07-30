import express from 'express';
import Category from '../models/Category.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// POST /api/categories - Create a new category
router.post('/', auth, async (req, res) => {
  try {
    const { name, subcategories = [] } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    const category = new Category({
      name: name.trim(),
      subcategories: subcategories.map((sub: string) => sub.trim()).filter((sub: string) => sub !== '')
    });

    await category.save();
    res.status(201).json({ message: 'Category created successfully!', category });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    // Check if category name already exists (excluding current category)
    const existingCategory = await Category.findOne({ 
      name: name.trim(), 
      _id: { $ne: req.params.id } 
    });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category name already exists.' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        subcategories: subcategories ? subcategories.map((sub: string) => sub.trim()).filter((sub: string) => sub !== '') : undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Category updated successfully!', category });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Category deleted successfully!' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// POST /api/categories/:id/subcategories - Add subcategory to category
router.post('/:id/subcategories', auth, async (req, res) => {
  try {
    const { subcategory } = req.body;
    
    if (!subcategory || subcategory.trim() === '') {
      return res.status(400).json({ error: 'Subcategory name is required.' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if subcategory already exists
    if (category.subcategories.includes(subcategory.trim())) {
      return res.status(400).json({ error: 'Subcategory already exists.' });
    }

    category.subcategories.push(subcategory.trim());
    await category.save();

    res.json({ message: 'Subcategory added successfully!', category });
  } catch (err) {
    console.error('Error adding subcategory:', err);
    res.status(500).json({ error: 'Failed to add subcategory.' });
  }
});

// PUT /api/categories/:id/subcategories/:subIndex - Update subcategory
router.put('/:id/subcategories/:subIndex', auth, async (req, res) => {
  try {
    const { subcategory } = req.body;
    const subIndex = parseInt(req.params.subIndex);
    
    if (!subcategory || subcategory.trim() === '') {
      return res.status(400).json({ error: 'Subcategory name is required.' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (subIndex < 0 || subIndex >= category.subcategories.length) {
      return res.status(400).json({ error: 'Invalid subcategory index.' });
    }

    // Check if subcategory name already exists (excluding current one)
    const existingSubcategory = category.subcategories.find((sub, index) => 
      sub === subcategory.trim() && index !== subIndex
    );
    if (existingSubcategory) {
      return res.status(400).json({ error: 'Subcategory name already exists.' });
    }

    category.subcategories[subIndex] = subcategory.trim();
    await category.save();

    res.json({ message: 'Subcategory updated successfully!', category });
  } catch (err) {
    console.error('Error updating subcategory:', err);
    res.status(500).json({ error: 'Failed to update subcategory.' });
  }
});

// DELETE /api/categories/:id/subcategories/:subIndex - Delete subcategory
router.delete('/:id/subcategories/:subIndex', auth, async (req, res) => {
  try {
    const subIndex = parseInt(req.params.subIndex);

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (subIndex < 0 || subIndex >= category.subcategories.length) {
      return res.status(400).json({ error: 'Invalid subcategory index.' });
    }

    category.subcategories.splice(subIndex, 1);
    await category.save();

    res.json({ message: 'Subcategory deleted successfully!', category });
  } catch (err) {
    console.error('Error deleting subcategory:', err);
    res.status(500).json({ error: 'Failed to delete subcategory.' });
  }
});

export default router; 