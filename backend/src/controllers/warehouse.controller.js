import { db } from "../../prisma/db.ts";

export const createWarehouse = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) {
      return res.status(400).json({
        message: "Warehouse name is required",
      });
    }
    const warehouse = await db.orm.public.Warehouse.create({
      name,
      location,
    });
    res.status(201).json({
      message: "Warehouse created successfully",
      warehouse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create warehouse",
    });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await db.orm.public.Warehouse.all();
    res.json({
      message: "Warehouses fetched successfully",
      warehouses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch warehouses",
    });
  }
};

export const getWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await db.orm.public.Warehouse.first({
      id: Number(id),
    });
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    res.json({
      message: "Warehouse fetched successfully",
      warehouse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch warehouse",
    });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const existingWarehouse = await db.orm.public.Warehouse.first({
      id: Number(id),
    });
    if (!existingWarehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    const warehouse = await db.orm.public.Warehouse
      .where({ id: Number(id) })
      .update({
        name,
        location,
      });
    res.json({
      message: "Warehouse updated successfully",
      warehouse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update warehouse",
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const existingWarehouse = await db.orm.public.Warehouse.first({
      id: Number(id),
    });
    if (!existingWarehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    await db.orm.public.Warehouse
      .where({ id: Number(id) })
      .delete();
    res.json({
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete warehouse",
    });
  }
};