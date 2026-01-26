//get Stores as input and return true if user roles 
import { Store } from "../../lib/types/types";

export const checkRole = (stores: Store[]) => {
    //return map of role as string
    const roles = stores.map((store) => store.category.toString().toLowerCase());
    return roles;
}