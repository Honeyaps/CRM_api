import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface INote {
  id: string;
  content: string;
  lead_id: string;
  created_by: string;
}

interface NoteCreation extends Optional<INote, 'id'> {}

class Note extends Model<INote, NoteCreation> implements INote {
  declare id: string;
  declare content: string;
  declare lead_id: string;
  declare created_by: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Note.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'notes',
    indexes: [{ fields: ['lead_id'] }],
  }
);

export default Note;
