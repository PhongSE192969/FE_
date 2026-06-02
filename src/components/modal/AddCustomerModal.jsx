import React, { useState } from "react";
import { toast } from "react-hot-toast";
import customerService from "@/services/customerService";
import * as identityService from "@/services/identityService";
import InputField from "@/components/form/InputField";
import { X, UserPlus, Loader2 } from "lucide-react";

const AddCustomerModal = ({ franchiseId, onClose, onSuccess }) => {
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let userId = null;
      const identityRes = await identityService.createOrFindWalkInUser({
        phone,
        fullName,
      });

      if (identityRes.statusCode === 200 || identityRes.statusCode === 201) {
        userId = identityRes.data.id;
      } else {
        throw new Error("Failed to create or find User profile");
      }

      await customerService.createCustomerAtFranchise(franchiseId, userId);
      toast.success("Walk-in customer added successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      if (error?.response?.data?.errorCode === "CUSTOMER_ALREADY_EXISTS") {
        toast.error("This customer is already registered in your branch!");
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to create customer",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-slate-800 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-[#d9a13b]/10 flex items-center justify-center text-[#d9a13b]">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none">
              Add Walk-in Customer
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Register a new customer at POS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Phone Number"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="e.g. 0987654321"
          />

          <InputField
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Enter customer full name..."
          />

          <div className="flex gap-3 mt-8 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-[#d9a13b] text-white font-bold hover:bg-[#c49033] transition-colors text-sm shadow-lg shadow-yellow-900/10 active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Create Customer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
