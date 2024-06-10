import { OptionType } from "../map/map";
import styles from "./filter-row.module.css";

export type FilterOptionProps = {
  id: string;
  name: OptionType;
  label: string;
  checked: boolean;
  onChange: (isChecked: boolean, name: OptionType) => void;
  onWeightChange: (value: number, name: OptionType) => void;
  weight: number;
  showNumberInput?: boolean;
};

const FilterOption = ({
  id,
  name,
  label,
  checked,
  onChange,
  showNumberInput = true,
  onWeightChange,
  weight
}: FilterOptionProps) => {
  return (
    <div className={styles.filterRoot}>
      <span className={styles.filterLabel}>
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked, name)}
        />
        <label htmlFor={id}>{label}</label>
      </span>
      {showNumberInput && (
        <input type="number" className="coef_input" min={1} max={10} step={1} value={weight} onChange={(e) => onWeightChange(+e.target.value, name)}/>
      )}
    </div>
  );
};

export default FilterOption;
