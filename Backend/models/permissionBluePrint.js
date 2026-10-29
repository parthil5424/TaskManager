import mongoose from "mongoose";

const modulePermissionSchema = new mongoose.Schema(
  {
    canCreate: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canView: { type: Boolean, default: false },
    canEditAll: { type: Boolean, default: false },
    canDeleteAll: { type: Boolean, default: false },
    canViewAll: { type: Boolean, default: false },
  },
  { _id: false },
);

const moduleSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    permissions: {
      type: modulePermissionSchema,
      required: true,
      default: () => ({}),
    },
  },
  { _id: false },
);

const permissionBlueprintSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: ["USER", "ADMIN"],
      uppercase: true,
      trim: true,
    },
    permissions: {
      type: [moduleSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const permissionBluePrint = mongoose.model(
  "permissionBluePrint",
  permissionBlueprintSchema,
  "permissionBluePrints",
);

export default permissionBluePrint;
