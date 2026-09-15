import { db } from "../../prisma/db.ts";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      categoryId,
      supplierId,
    } = req.body;

    if (!name || !sku || price === undefined) {
      return res.status(400).json({
        message: "Name, SKU and price are required",
      });
    }

    const existingProduct = await db.orm.public.Product.first({
      sku,
    });

    if (existingProduct) {
      return res.status(409).json({
        message: "Product with this SKU already exists",
      });
    }

    const product = await db.orm.public.Product.create({
      name,
      sku,
      description,
      price,
      categoryId,
      supplierId,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await db.orm.public.Product.all();

    res.json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await db.orm.public.Product.first({
      id: Number(id),
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      categoryId,
      supplierId,
    } = req.body;

    const existingProduct = await db.orm.public.Product.first({
      id: Number(id),
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = await db.orm.public.Product
      .where({ id: Number(id) })
      .update({
        name,
        description,
        price,
        categoryId,
        supplierId,
      });

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await db.orm.public.Product.first({
      id: Number(id),
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await db.orm.public.Product
      .where({ id: Number(id) })
      .delete();

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};