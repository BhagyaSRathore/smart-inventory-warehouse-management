import { db } from "../../prisma/db.ts";

export const createRack = async (req, res) => {
  try {
    const { name, warehouseId } = req.body;
    if (!name || !warehouseId) {
      return res.status(400).json({
        message: "Rack name and warehouseId are required",
      });
    }
    const warehouse = await db.orm.public.Warehouse.first({
      id: Number(warehouseId),
    });
    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }
    const rack = await db.orm.public.Rack.create({
      name,
      warehouseId: Number(warehouseId),
    });
    res.status(201).json({
      message: "Rack created successfully",
      rack,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create rack",
    });
  }
};

export const getRacks = async (req, res) => {
  try {
    const racks = await db.orm.public.Rack.all();
    res.json({
      message: "Racks fetched successfully",
      racks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch racks",
    });
  }
};

export const getRack = async (req, res) => {
  try {
    const { id } = req.params;
    const rack = await db.orm.public.Rack.first({
      id: Number(id),
    });
    if (!rack) {
      return res.status(404).json({
        message: "Rack not found",
      });
    }
    res.json({
      message: "Rack fetched successfully",
      rack,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch rack",
    });
  }
};

export const updateRack = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, warehouseId } = req.body;
    const existingRack = await db.orm.public.Rack.first({
      id: Number(id),
    });
    if (!existingRack) {
      return res.status(404).json({
        message: "Rack not found",
      });
    }
    const rack = await db.orm.public.Rack
      .where({ id: Number(id) })
      .update({
        name,
        warehouseId: Number(warehouseId),
      });
    res.json({
      message: "Rack updated successfully",
      rack,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update rack",
    });
  }
};

export const deleteRack = async (req, res) => {
  try {
    const { id } = req.params;
    const existingRack = await db.orm.public.Rack.first({
      id: Number(id),
    });
    if (!existingRack) {
      return res.status(404).json({
        message: "Rack not found",
      });
    }
    await db.orm.public.Rack
      .where({ id: Number(id) })
      .delete();
    res.json({
      message: "Rack deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete rack",
    });
  }
};