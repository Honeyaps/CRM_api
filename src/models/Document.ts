import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface IDocument {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  lead_id: string;
  uploaded_by: string;
}

interface DocumentCreation extends Optional<IDocument, 'id'> {}

class Document extends Model<IDocument, DocumentCreation> implements IDocument {
  declare id: string;
  declare filename: string;
  declare original_name: string;
  declare mime_type: string;
  declare size: number;
  declare path: string;
  declare lead_id: string;
  declare uploaded_by: string;
  declare readonly created_at: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'documents',
    updatedAt: false,
    indexes: [{ fields: ['lead_id'] }],
  }
);

export default Document;
