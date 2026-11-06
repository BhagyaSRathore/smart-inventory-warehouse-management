import { db } from "../db.ts";

/**
 * POST /api/customers
 * Create a new customer
 */
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    const customer = await db.orm.public.Customer.create({
      name: String(name).trim(),
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      address: address ? String(address).trim() : null,
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Create Customer error:", error);
    return res.status(500).json({
      message: "Failed to create customer",
    });
  }
};

/**
 * GET /api/customers
 * Get all customers
 */
export const getCustomers = async (req, res) => {
  try {
    const customers = await db.orm.public.Customer.all();

    return res.status(200).json({
      message: "Customers fetched successfully",
      customers,
    });
  } catch (error) {
    console.error("Get Customers error:", error);
    return res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
};

/**
 * GET /api/customers/:id
 * Get single customer details
 */
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid customer ID is required",
      });
    }

    const customer = await db.orm.public.Customer.first({ id: numId });
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("Get Customer error:", error);
    return res.status(500).json({
      message: "Failed to fetch customer",
    });
  }
};

/**
 * PUT /api/customers/:id
 * Update customer
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid customer ID is required",
      });
    }

    const existing = await db.orm.public.Customer.first({ id: numId });
    if (!existing) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const { name, email, phone, address } = req.body;

    const updated = await db.orm.public.Customer
      .where({ id: numId })
      .update({
        name: name !== undefined ? String(name).trim() : existing.name,
        email: email !== undefined ? (email ? String(email).trim() : null) : existing.email,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : existing.phone,
        address: address !== undefined ? (address ? String(address).trim() : null) : existing.address,
      });

    return res.status(200).json({
      message: "Customer updated successfully",
      customer: updated,
    });
  } catch (error) {
    console.error("Update Customer error:", error);
    return res.status(500).json({
      message: "Failed to update customer",
    });
  }
};

/**
 * DELETE /api/customers/:id
 * Delete customer
 */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    if (!id || Number.isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        message: "Valid customer ID is required",
      });
    }

    const existing = await db.orm.public.Customer.first({ id: numId });
    if (!existing) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Check if customer has associated sales orders
    const allOrders = await db.orm.public.SalesOrder.all();
    const customerOrders = allOrders.filter((o) => o.customerId === numId);

    if (customerOrders.length > 0) {
      return res.status(400).json({
        message: "Cannot delete customer with associated sales orders",
      });
    }

    await db.orm.public.Customer
      .where({ id: numId })
      .delete();

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer error:", error);
    return res.status(500).json({
      message: "Failed to delete customer",
    });
  }
};
