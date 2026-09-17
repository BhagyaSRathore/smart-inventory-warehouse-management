import { db } from "../db.ts";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const existingCategory = await db.orm.public.Category.first({
      name,
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    const category = await db.orm.public.Category.create({
      name,
      description,
    });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create category",
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await db.orm.public.Category.all();

    res.json({
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await db.orm.public.Category.first({
      id: Number(id),
    });

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({
      message: "Category fetched successfully",
      category,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch category",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingCategory = await db.orm.public.Category.first({
      id: Number(id),
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const category = await db.orm.public.Category
      .where({ id: Number(id) })
      .update({
        name,
        description,
      });

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update category",
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCategory = await db.orm.public.Category.first({
      id: Number(id),
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await db.orm.public.Category
      .where({ id: Number(id) })
      .delete();

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete category",
    });
  }
};