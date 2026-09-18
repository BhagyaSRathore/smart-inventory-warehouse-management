import { db } from "../db.ts";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      description,
      price,
      costPrice,
      reorderLevel,
      safetyStock,
      imageUrl,
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
    
    // Check barcode uniqueness if provided
    if (barcode) {
      const existingBarcode = await db.orm.public.Product.first({
        barcode,
      });
      if (existingBarcode) {
        return res.status(409).json({
          message: "Product with this barcode already exists",
        });
      }
    }

    const product = await db.orm.public.Product.create({
      name,
      sku,
      barcode: barcode || null,
      description,
      price,
      costPrice: costPrice || null,
      reorderLevel: reorderLevel !== undefined ? reorderLevel : 10,
      safetyStock: safetyStock !== undefined ? safetyStock : 5,
      imageUrl: imageUrl || null,
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

export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        message: "Barcode is required",
      });
    }

    const product = await db.orm.public.Product.first({
      barcode,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found with this barcode",
      });
    }

    // Get inventory information for this product
    const inventories = await db.orm.public.Inventory.where({
      productId: product.id,
    }).all();

    // Enrich with warehouse and rack details
    const inventoryDetails = await Promise.all(
      inventories.map(async (inv) => {
        const warehouse = await db.orm.public.Warehouse.first({
          id: inv.warehouseId,
        });
        
        let rack = null;
        if (inv.rackId) {
          rack = await db.orm.public.Rack.first({
            id: inv.rackId,
          });
        }

        return {
          inventoryId: inv.id,
          quantity: inv.quantity,
          warehouse: {
            id: warehouse.id,
            name: warehouse.name,
            location: warehouse.location,
          },
          rack: rack ? {
            id: rack.id,
            name: rack.name,
          } : null,
        };
      })
    );

    // Get category and supplier details
    let category = null;
    if (product.categoryId) {
      category = await db.orm.public.Category.first({
        id: product.categoryId,
      });
    }

    let supplier = null;
    if (product.supplierId) {
      supplier = await db.orm.public.Supplier.first({
        id: product.supplierId,
      });
    }

    // Calculate total stock
    const totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);

    res.json({
      message: "Product found",
      product: {
        ...product,
        category: category ? { id: category.id, name: category.name } : null,
        supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
      },
      inventory: {
        totalStock,
        locations: inventoryDetails,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product by barcode",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      barcode,
      description,
      price,
      costPrice,
      reorderLevel,
      safetyStock,
      imageUrl,
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
    
    // Check barcode uniqueness if changed
    if (barcode && barcode !== existingProduct.barcode) {
      const barcodeExists = await db.orm.public.Product.first({
        barcode,
      });
      if (barcodeExists && barcodeExists.id !== Number(id)) {
        return res.status(409).json({
          message: "Another product with this barcode already exists",
        });
      }
    }

    const product = await db.orm.public.Product
      .where({ id: Number(id) })
      .update({
        name,
        barcode: barcode || null,
        description,
        price,
        costPrice: costPrice || null,
        reorderLevel,
        safetyStock,
        imageUrl: imageUrl || null,
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
