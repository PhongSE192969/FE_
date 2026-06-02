import {
  Login,
  ResendCode,
  Register,
  Verify,
  Logout,
  ForgotPassword,
  ConfirmForrgotPassword,
} from "@/services/authService";

import {
  GetProfile,
  GetCountUsers,
  GetAllUsers,
  SearchUsers,
  CreateOne,
  AssignRole,
  DeleteOne,
  UpdateUser,
  UpdateProfile,
  ChangeStatus,
  ChangePassword,
  GetStaffByFranchise,
} from "@/services/userService";

import {
  GetRoles,
  CreateRole,
  UpdateRole,
  DeleteRole,
  AssignPermissionsToRole,
  GetPermissions,
  CreatePermission,
  UpdatePermission,
  DeletePermission,
} from "./identityService";

import { loyaltyApi } from "@/services/loyaltyApi";
import {
  getAllProducts,
  SearchProducts,
  GetAllCategories,
  DeleteProduct,
} from "@/services/productService";
import { getAllCategories, categoryService } from "@/services/categoryService";
import { aiService } from "@/services/aiService";

import {
  GetAllFranchises,
  GetFranchiseActive,
} from "@/services/franchiseService";

import {
  SearchCustomers,
  SaveCustomerFranchise,
} from "@/services/customerService";

export {
  // auth & user
  Login,
  Logout,
  ResendCode,
  Register,
  Verify,
  GetProfile,
  GetCountUsers,
  GetAllUsers,
  SearchUsers,
  CreateOne,
  AssignRole,
  DeleteOne,
  UpdateUser,
  UpdateProfile,
  ChangeStatus,
  ChangePassword,
  ForgotPassword,
  ConfirmForrgotPassword,
  GetStaffByFranchise,

  // role
  GetRoles,
  CreateRole,
  UpdateRole,
  DeleteRole,
  AssignPermissionsToRole,
  GetPermissions,
  CreatePermission,
  UpdatePermission,
  DeletePermission,
  loyaltyApi,


  // productService,
  categoryService,
  getAllCategories,
  getAllProducts,
  GetAllCategories,
  SearchProducts,
  DeleteProduct,

  aiService,

  GetAllFranchises,
  GetFranchiseActive,
  SearchCustomers,
  SaveCustomerFranchise,
};
