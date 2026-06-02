import { apiCall, ENDPOINTS } from "@/config/api";
import { HTTP_METHODS } from "@/constraints";
// user
export const GetProfile = async () => {
  try {
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.USER.profile
    );
    return res;
  } catch (error) {
    if (error.response?.status === 401) {
      console.warn("Unauthorized. Token may have expired.");
    } else {
      console.error("Get profile error:", error);
    }
  }
};

export const GetCountUsers = async () => {
  try {
    const res = await apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.USER.counts);
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.warn("Unauthorized. Token may have expired.");
    } else {
      console.error("Get count users error:", error);
    }
  }
}

// managerment user
export const GetAllUsers = async (payload) => {
  try {
    const page = payload?.page || 0;
    const res = await apiCall(HTTP_METHODS.GET, ENDPOINTS.PROTECTED.USER.getAll, null, {
      params: { page },
    });
    return res.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to load users",
      );
    }
  }
}

export const SearchUsers = async (payload) => {
  try {
    // payload chứa: keyword, role, status, gender, page, size, sortBy, sortDir
    // console.log('payload search: ', payload)
    const res = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.USER.search,
      null,
      { params: payload }
    );
    return res.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to search users",
      );
    }
  }
};

export const CreateOne = async (payload) => {
  try {

    console.log("payload created: ", payload)
    const res = await apiCall(
      HTTP_METHODS.POST,
      ENDPOINTS.PROTECTED.USER.create,
      payload
    );

    return res;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to search users",
      );
    }
  }
};

export const AssignRole = async (payload) => {
  try {
    console.log('payload assign role: ', payload.params)
    const response = await apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.USER.assignRole(payload.userId),
      null,
      { params: payload.params }
    )

    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to assign role",
      );
    }
  }
}
export const UpdateUser = async (payload) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.USER.update(payload.userId),
      payload.data
    );

    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to delete user",
      );
    }
  }
}
// xóa mềm: update status
export const DeleteOne = async (payload) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.USER.delete(payload.userId),
    )
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to delete user",
      );
    }
  }
};

export const ChangeStatus = async (payload) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.USER.changeStatus(payload.userId),
      null,
      { params: payload.params }
    )
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to change user status",
      );
    }
  }
};

export const ChangePassword = async (payload) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.POST,
      ENDPOINTS.PROTECTED.USER.changePassword,
      payload
    );

    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to change password",
      );
    }
  }
}

export const UpdateProfile = async (payload) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.PUT,
      ENDPOINTS.PROTECTED.USER.updateProfile,
      payload
    );

    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to update profile",
      );
    }
  }
}

export const GetStaffByFranchise = async (payload) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.GET,
      ENDPOINTS.PROTECTED.USER.getStaffByFranchise,
      null,
      { params: payload }
    );

    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to get staff by franchise",
      );
    }
  }
}

export const SearchUsersByIds = async (ids) => {
  try {
    const response = await apiCall(
      HTTP_METHODS.POST,
      ENDPOINTS.PROTECTED.USER.searchByIds,
      ids
    );
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data.message || "Failed to search users by ids"
      );
    }
  }
};