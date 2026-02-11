export interface Outlet {
  id: string;
  _id?: string;
  name: string;
  description: string;
  images: string[];
  addressId: string;
  managerId: string;
  formId?: string;
  productTemplateId?: string;
  type: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateOutletPayload {
  name: string;
  description: string;
  images: string[];
  addressId: string;
  managerId: string;
  formId?: string;
  productTemplateId?: string;
  type: string;
}
