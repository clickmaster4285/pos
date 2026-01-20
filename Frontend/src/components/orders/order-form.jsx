'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useGetAllProductsQuery } from '@/features/productApi';
import { useGetAllStaffQuery } from '@/features/staffApi';
import { useListTablesQuery } from '@/features/tableApi';

import useScopedFields from './useScopedFields';
import { currency, normalizeItems } from './helpers';

import ItemsSection from './ItemsSection';
import CustomerAndMetaPanel from './CustomerAndMetaPanel';
import ShippingAddressPanel from './ShippingAddressPanel';
import WaiterSelectPanel from './WaiterSelectPanel';

export default function OrderForm({ onSubmit, loading, isEndUser }) {
  const user = useSelector((state) => state.auth.user);
  const industry = user?.industryName || '';

  const isWaiter = (user?.subRole || '').toLowerCase() === 'waiter';
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const subRoleLC = (user?.subRole || '').toLowerCase();
  const roleLC = (user?.role || '').toLowerCase();
  const industryLC = (industry || '').toLowerCase();
  const isRestaurant = industryLC === 'restaurant';
  const isFashionPharmacy =
    industryLC === 'fashion' || industryLC === 'pharmacy';
  const isUserSubRole = subRoleLC === 'user';

  const { data: table = [], refetch: refetchTables } = useListTablesQuery();

  const tables = table.filter((t) => t.state === 'available');

  const { data: staff = [] } = useGetAllStaffQuery();

  // map waiterId -> waiterName
  const waiterMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(staff) ? staff : []).forEach((s) => {
      const id = String(s?._id || s?.id || '');
      if (!id) return;
      const name = s?.fullName || s?.name || 'Unnamed';
      map.set(id, name);
    });
    return map;
  }, [staff]);

  const [values, setValues] = useState({
    orderType: '',
    dynamicAttributes: {}, // order-level attrs
    shippingAddressId: '', // for Delivery/Online
    items: normalizeItems(),
    customerName: '',
    customerPhone: '',
    waiterId: '', // optional top-level (kept for compatibility)
  });

  const [errors, setErrors] = useState({
    orderType: '',
    shippingAddressId: '',
    items: {},
    customerName: '',
    customerPhone: '',
    waiterId: '',
    tableNo: '',
  });

  const submitting = !!loading;

  // If logged-in user is a waiter, default their id/name
  useEffect(() => {
    if (!isWaiter) return;
    const myId = String(user?._id || '');
    const myName = user?.fullName || user?.name || '';
    setValues((v) => ({
      ...v,
      waiterId: myId, // optional top-level
      dynamicAttributes: {
        ...v.dynamicAttributes,
        waiterId: myId, // store inside dynamicAttributes (required)
        waiterName: myName,
      },
    }));
  }, [isWaiter, user]);

  /* ----- PRODUCTS from API ----- */
  const { data: productsResp, isLoading: productsLoading } =
    useGetAllProductsQuery();

  const productList = useMemo(() => productsResp?.data ?? [], [productsResp]);

  const invById = useMemo(() => {
    const m = new Map();
    productList.forEach((p) => {
      const id = String(p?._id || '');
      if (id) m.set(id, p);
    });
    return m;
  }, [productList]);

  const invOptions = useMemo(
    () =>
      productList.map((p) => ({
        id: String(p._id),
        label: p.productName || 'Unnamed',
        sub: p.SKU ? `(${p.SKU})` : '',
      })),
    [productList]
  );

  // backfill item fields when product list changes
  useEffect(() => {
    setValues((v) => ({
      ...v,
      items: v.items.map((row) => {
        if (!row.productId) return row;
        const inv = invById.get(String(row.productId));
        if (!inv) return row;
        const price = Number(inv?.sellingPrice ?? row.price ?? 0);
        const name = inv?.productName || row.name || '';
        return {
          ...row,
          name,
          price,
          total: Number(row.qty || 0) * price,
        };
      }),
    }));
  }, [invById]);

  /* derive orderType options from industry */
  const orderScopedFields = useScopedFields(industry, 'order');
  const itemScopedFields = useScopedFields(industry, 'item');

  const policy = useMemo(() => {
    // default options (used if order scope didn't define its own select options)
    const defaultOptions = [
      'Dine-In',
      'Takeaway',
      'Delivery',
      'In-Store',
      'Online',
      'Purchase',
      'Service',
    ];
    const scoped = orderScopedFields.find(
      (x) => x.name === 'orderType' && x.type === 'select'
    );
    const baseOptions = scoped?.options?.length
      ? scoped.options
      : defaultOptions;

    // RESTAURANT
    if (isRestaurant) {
      if (isUserSubRole || isEndUser) {
        return { forced: 'Delivery', lock: true, options: ['Delivery'] };
      }
      // Staff: only Dine-In / Takeaway
      return { forced: null, lock: false, options: ['Dine-In', 'Takeaway'] };
    }

    // FASHION / PHARMACY
    if (isFashionPharmacy) {
      if (isUserSubRole || isEndUser) {
        return { forced: 'Delivery', lock: true, options: ['Delivery'] };
      }
      // Admin or other staff
      return { forced: 'In-Store', lock: true, options: ['In-Store'] };
    }

    // Other industries: keep your previous behavior
    if (isEndUser) {
      return { forced: 'Online', lock: true, options: ['Online', 'Delivery'] };
    }
    return {
      forced: 'In-Store',
      lock: true,
      options: ['In-Store', 'Delivery'],
    };
  }, [
    orderScopedFields,
    isRestaurant,
    isFashionPharmacy,
    isUserSubRole,
    isEndUser,
  ]);

  const orderTypeOptions = policy.options;
  // enforce forced orderType when policy requires it

  // helpers to mutate state
  const update = (patch) => setValues((v) => ({ ...v, ...patch }));
  const updateItem = (idx, patch) =>
    setValues((v) => {
      const next = v.items.map((it, i) =>
        i === idx ? { ...it, ...patch } : it
      );
      if ('qty' in patch || 'price' in patch) {
        const t = Number(next[idx].qty || 0) * Number(next[idx].price || 0);
        next[idx].total = t;
      }
      return { ...v, items: next };
    });
  const addItem = () =>
    setValues((v) => ({
      ...v,
      items: [
        ...v.items,
        {
          productId: '',
          name: '',
          qty: 1,
          price: 0,
          total: 0,
          dynamicAttributes: {},
        },
      ],
    }));
  const removeItem = (idx) =>
    setValues((v) => ({ ...v, items: v.items.filter((_, i) => i !== idx) }));

  // select product → also pre-fill allowed item-scoped dynamicAttributes

  const onProductSelect = (idx, id) => {
    const nextInv = invById.get(id);
    const price = Number(nextInv?.sellingPrice ?? 0);
    const name = nextInv?.productName || '';

    const allowed = new Set(itemScopedFields.map((f) => f.name));
    const dynSrc = nextInv?.metaData || {};
    const dyn = {};
    Object.entries(dynSrc).forEach(([k, v]) => {
      if (allowed.has(k)) dyn[k] = v;
    });

    // 🔹 Only true when explicitly marked as required
    const metaSrc = nextInv?.metaData || {};
    const rawFlag = metaSrc.prescriptionRequired;
    const requiresPrescription =
      rawFlag === true || rawFlag === 'true' || rawFlag === 'yes';

    if (requiresPrescription) {
      dyn.requiresPrescription = true;
    }

  

    const qty = Number(values.items[idx]?.qty || 0);
    updateItem(idx, {
      productId: id,
      name,
      price,
      total: qty * price,
      dynamicAttributes: dyn,
    });
  };

  // --- Visibility flags ---
  const orderTypeLC = (values.orderType || '').toLowerCase();
  const isDineIn =
    orderTypeLC === 'dine-in' ||
    orderTypeLC === 'dine in' ||
    orderTypeLC === 'dinein';
  const isAddressRequired =
    orderTypeLC === 'online' || orderTypeLC === 'delivery';

  // keep dynamicAttributes.orderType in sync if the field exists in order scope
  useEffect(() => {
    const hasOrderTypeInOrderFields = orderScopedFields.some(
      (f) => f.name === 'orderType'
    );
    if (!hasOrderTypeInOrderFields) return;

    setValues((v) => ({
      ...v,
      dynamicAttributes: { ...v.dynamicAttributes, orderType: v.orderType },
      // if address is NOT required anymore, clear selection
      shippingAddressId: isAddressRequired ? v.shippingAddressId : '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.orderType]);

  // validation (with dine-in guardrails)
  const validate = () => {
    const nextErrors = {
      orderType: values.orderType ? '' : 'Order type is required',
      shippingAddressId:
        isAddressRequired && !values.shippingAddressId
          ? 'Shipping address is required for Delivery/Online orders'
          : '',
      items: {},
      tableNo:
        isDineIn && !values?.dynamicAttributes?.tableNo
          ? 'Table is required for Dine-In'
          : '',
      waiterId:
        isDineIn && !values?.dynamicAttributes?.waiterId
          ? 'Waiter is required for Dine-In (select a table)'
          : '',
    };

    values.items.forEach((row, idx) => {
      const nameOk = typeof row.name === 'string' && row.name.trim().length > 0;
      const priceNum = Number(row.price);
      const priceOk = Number.isFinite(priceNum) && priceNum >= 0;
      const qtyNum = Number(row.qty);
      const qtyOk = Number.isInteger(qtyNum) && qtyNum > 0;

      //checking for quantity

      const inv = row.productId ? invById.get(String(row.productId)) : null;
      const stockOk =
        isRestaurant || !inv || qtyNum <= Number(inv?.quantity ?? Infinity);

      const itemErr = {
        name: nameOk ? '' : 'Item name is required',
        price: priceOk ? '' : 'Price must be a non-negative number',
        qty: qtyOk ? '' : 'Qty must be a positive integer',
        stock:
          isRestaurant || stockOk ? '' : `Only ${inv?.quantity ?? 0} in stock`,
      };
      //-------------
      if (itemErr.name || itemErr.price || itemErr.qty || itemErr.stock) {
        nextErrors.items[idx] = itemErr;
      }
    });

    setErrors(nextErrors);

    const top =
      nextErrors.orderType ||
      nextErrors.shippingAddressId ||
      nextErrors.tableNo ||
      nextErrors.waiterId ||
      nextErrors.customerName ||
      nextErrors.customerPhone;

    const itemHasErrors = Object.keys(nextErrors.items).length > 0;

    return !(top || itemHasErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const itemsPayload = values.items
      .filter((it) => it.name && Number(it.qty) > 0)
      .map((it) => ({
        productId: it.productId || undefined,
        name: it.name,
        qty: Number(it.qty),
        price: Number(it.price),
        total: Number(it.total || Number(it.price) * Number(it.qty)),
        dynamicAttributes: it.dynamicAttributes || {},
      }));

    const payload = {
      items: itemsPayload,
      orderType: values.orderType,
      dynamicAttributes: {
        ...values.dynamicAttributes, // includes waiterId, waiterName, tableNo, tableName, specialInstructions, orderType
      },
      ...(isAddressRequired && values.shippingAddressId
        ? { shippingAddressId: values.shippingAddressId }
        : {}),
      customerName: values.customerName.trim(),
      customerPhone: String(values.customerPhone).trim(),
    };

    //  await onSubmit?.(payload);

    try {
      await onSubmit?.(payload);
      await refetchTables(); // ⬅️ refresh tables list
    } catch (err) {
      console.error(err.message);
    }
  };

  // totals
  const subTotal = useMemo(
    () => values.items.reduce((s, it) => s + Number(it.total || 0), 0),
    [values.items]
  );

  // table → waiter auto-fill
  const handleTableSelect = (tableId) => {
    const table = Array.isArray(tables)
      ? tables.find((t) => String(t?._id) === String(tableId))
      : null;

    const assignedWaiterId = table?.assignedWaiterId
      ? String(table.assignedWaiterId)
      : '';
    const assignedWaiterName = assignedWaiterId
      ? waiterMap.get(assignedWaiterId) || ''
      : '';

    setValues((v) => ({
      ...v,
      waiterId: assignedWaiterId || '', // optional top-level
      dynamicAttributes: {
        ...v.dynamicAttributes,
        tableNo: table ? String(table._id) : '',
        tableName: table?.name || '',
        waiterId: assignedWaiterId || '', // REQUIRED: we persist this
        waiterName: assignedWaiterName || '',
        //orderStatus: v.dynamicAttributes?.orderStatus || 'pending',
      },
    }));
  };

  const forcedOrderType = policy.forced; // string | null
  const lockOrderType = policy.lock;

  useEffect(() => {
    if (!forcedOrderType) return; // restaurant staff case (free selection)
    setValues((v) => {
      if ((v.orderType || '').toLowerCase() === forcedOrderType.toLowerCase()) {
        return v;
      }
      return { ...v, orderType: forcedOrderType };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedOrderType]);

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <ItemsSection
        values={values}
        errors={errors}
        invById={invById}
        invOptions={invOptions}
        productsLoading={productsLoading}
        itemScopedFields={itemScopedFields}
        updateItem={updateItem}
        addItem={addItem}
        removeItem={removeItem}
        onProductSelect={onProductSelect}
      />

      <CustomerAndMetaPanel
        values={values}
        errors={errors}
        update={update}
        orderTypeOptions={orderTypeOptions}
        orderScopedFields={orderScopedFields}
        isDineIn={isDineIn}
        tables={tables}
        onTableSelect={handleTableSelect}
        forcedOrderType={forcedOrderType}
        lockOrderType={lockOrderType}
      />

      {/* Address panel for Delivery/Online */}
      <ShippingAddressPanel
        values={values}
        errors={errors}
        update={update}
        isAddressRequired={isAddressRequired}
      />

      {/* Read-only waiter display for dine-in */}
      <WaiterSelectPanel
        industry={industry}
        user={user}
        isWaiter={isWaiter}
        isAdmin={isAdmin}
        values={values}
        errors={errors}
        setValues={setValues}
        isDineIn={isDineIn}
      />

      {/* Totals */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-muted/40 p-4">
        <div className="text-sm text-muted-foreground">
          Review your items before submitting.
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-sm font-medium">Subtotal</span>
          <span className="rounded-md bg-background px-3 py-1.5 text-base font-semibold shadow-sm">
            {currency(subTotal)}
          </span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}
