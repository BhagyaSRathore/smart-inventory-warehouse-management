import { db } from "../../prisma/db.ts";

export const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Supplier name is required",
      });
    }

    const supplier = await db.orm.public.Supplier.create({
      name,
      email,
      phone,
      address,
    });

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create supplier",
    });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await db.orm.public.Supplier.all();

    res.json({
      message: "Suppliers fetched successfully",
      suppliers,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch suppliers",
    });
  }
};

export const getSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await db.orm.public.Supplier.first({
      id: Number(id),
    });

    if (!supplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    res.json({
      message: "Supplier fetched successfully",
      supplier,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch supplier",
    });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const existingSupplier = await db.orm.public.Supplier.first({
      id: Number(id),
    });

    if (!existingSupplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    const supplier = await db.orm.public.Supplier
      .where({ id: Number(id) })
      .update({
        name,
        email,
        phone,
        address,
      });

    res.json({
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update supplier",
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSupplier = await db.orm.public.Supplier.first({
      id: Number(id),
    });

    if (!existingSupplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    await db.orm.public.Supplier
      .where({ id: Number(id) })
      .delete();

    res.json({
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete supplier",
    });
  }
};