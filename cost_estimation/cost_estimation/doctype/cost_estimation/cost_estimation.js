// Copyright (c) 2025, Avi and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Cost Estimation", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Cost Estimation', {
    product(frm) {
        const filter = { filters: { product: frm.doc.product } };
        frm.set_query('catalog', () => filter);
        frm.set_query('addons', () => filter);
        updateTotalCost(frm); // Update total cost whenever product changes
    },

    quantity(frm) {
        if (frm.doc.quantity === 0 || frm.doc.quantity % 500 !== 0) {
            frappe.msgprint('Quantity must be a multiple of 500 and non-zero');
            frm.set_value('quantity', null); // Reset to null if invalid quantity
        } else {
            updateTotalCost(frm); // Update total cost when quantity is valid
        }
    },

    catalog(frm) {
        updateTotalCost(frm); // Update total cost when catalog cost changes
    },

    addons(frm) {
        if (!frm.doc.addons || frm.doc.addons.length === 0) {
            frm.set_value('addon_cost', 0);
            updateTotalCost(frm); // Ensure total cost is updated with no addons
            return;
        }

        const selected_addons = frm.doc.addons.map(link => link.addon);
        frappe.call({
            method: 'frappe.client.get_list',
            args: { doctype: 'Addons', filters: { name: ['in', selected_addons] }, fields: ['addon_price'] },
            callback({ message }) {
                const addon_cost = message?.reduce((sum, row) => sum + parseFloat(row.addon_price || 0), 0) || 0;
                frm.set_value('addon_cost', addon_cost);
                updateTotalCost(frm); // Ensure total cost updates when addons cost changes
            }
        });
    },

    validate(frm) {
        const product_filter = frm.doc.product;

        // Validate catalog matches product filter
        if (frm.doc.catalog) {
            frappe.db.get_value('Catalog', frm.doc.catalog, 'product', (r) => {
                if (r.product !== product_filter) {
                    frappe.msgprint(`The selected catalog does not fall under selected product: ${product_filter}`);
                    frappe.validated = false; // Prevent save
                }
            });
        }

        // Validate addons match product filter
        if (frm.doc.addons && frm.doc.addons.length > 0) {
            const invalid_addons = [];
            const addon_promises = frm.doc.addons.map(link =>
                frappe.db.get_value('Addons', link.addon, 'product', (r) => {
                    if (r.product !== product_filter) {
                        invalid_addons.push(link.addon);
                    }
                })
            );

            Promise.all(addon_promises).then(() => {
                if (invalid_addons.length > 0) {
                    frappe.msgprint(
                        `The following addons (${invalid_addons.join(', ')}) does not fall under selected product: ${product_filter}`
                    );
                    frappe.validated = false; // Prevent save
                }
            });
        }
    },
});

function updateTotalCost(frm) {
    const { catalog_cost = 0, addon_cost = 0, quantity = 1 } = frm.doc;
    const multiplier = quantity / 500; // Calculate multiplier based on quantity
    const total_cost = (catalog_cost + addon_cost) * multiplier; // Calculate total cost
    frm.set_value('total_cost', total_cost);
}

