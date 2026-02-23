// get Outlets as input and return role strings
import type { Outlet } from '../../lib/types/outlet';

export const checkRole = (outlets: Outlet[]) => {
  return outlets.map((outlet) => outlet.category.toString().toLowerCase());
};
