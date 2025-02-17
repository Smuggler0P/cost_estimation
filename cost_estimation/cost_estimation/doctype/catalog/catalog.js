// Copyright (c) 2025, Avi and contributors
// For license information, please see license.txt

frappe.ui.form.on("Catalog", {
    product(frm) {
        // Create a filter object based on the selected product
        const filter = { filters: { product: frm.doc.product } };

        // Dynamically set queries for the fields
        frm.set_query('card_material', () => filter);
        frm.set_query('finish', () => filter);
        frm.set_query('style', () => filter);
    }
});

