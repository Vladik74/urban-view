import React, { Dispatch, SetStateAction } from "react";
import styles from "./filter-form.module.css";
import { OptionType } from "../map/map";
import FilterOption from "../filter-row/filter-row";

// type OptionType = 'parks' | 'schools' | 'health' | null;
type FilterFormTypeProps = {
  selectedOptions: OptionType[];
  setSelectedOptions: Dispatch<SetStateAction<OptionType[]>>;
  selectedOptionsWeight: Record<OptionType, number>;
  setSelectedOptionsWeight: Dispatch<SetStateAction<Record<OptionType, number>>>;
};
export default function FilterForm({selectedOptions, setSelectedOptions, selectedOptionsWeight, setSelectedOptionsWeight}: FilterFormTypeProps) {
//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     alert(`Selected option: ${selectedOption}`);
//   };
function removeItemOnce(arr: OptionType[], value: OptionType) {
    const index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }

function onChangeAction(isChecked: boolean, option: OptionType) {
    setSelectedOptions((prev) => {
        let newOptions = [...prev];
        if (isChecked) newOptions.push(option);
        else newOptions = removeItemOnce(newOptions, option);
        return newOptions;
})
}

function onChangeWeightAction(value: number, name: OptionType) {
  setSelectedOptionsWeight((prev) => {
    const newOptionsRecord = {...prev};
    newOptionsRecord[name] = value;
    return newOptionsRecord;
  })
}

  return (
<form className={styles.root}>
      <h1>Choose a filter for map</h1>
      <FilterOption
        id="parks"
        name="parks"
        label="Parks"
        checked={selectedOptions.includes("parks")}
        onChange={onChangeAction}
        showNumberInput={true}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.parks}
      />
      <FilterOption
        id="schools"
        name="schools"
        label="Schools"
        checked={selectedOptions.includes("schools")}
        onChange={onChangeAction}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.schools}
      />
      <FilterOption
        id="health"
        name="health"
        label="Health"
        checked={selectedOptions.includes("health")}
        onChange={onChangeAction}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.health}
      />
      <FilterOption
        id="eat"
        name="eat"
        label="Eat"
        checked={selectedOptions.includes("eat")}
        onChange={onChangeAction}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.eat}
      />
      <FilterOption
        id="industrial"
        name="industrial"
        label="Industrial"
        checked={selectedOptions.includes("industrial")}
        onChange={onChangeAction}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.industrial}
      />
      <FilterOption
        id="kindergarten"
        name="kindergarten"
        label="Kindergarten"
        checked={selectedOptions.includes("kindergarten")}
        onChange={onChangeAction}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.kindergarten}
      />
      <FilterOption
        id="transport_steps"
        name="transport_steps"
        label="Transport steps"
        checked={selectedOptions.includes("transport_steps")}
        onChange={onChangeAction}
        onWeightChange={onChangeWeightAction}
        weight={selectedOptionsWeight.transport_steps}
      />
    </form>
  );
}
