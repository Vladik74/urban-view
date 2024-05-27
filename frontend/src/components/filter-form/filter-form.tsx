import React, { Dispatch, SetStateAction } from "react";
import styles from "./filter-form.module.css";
import { OptionType } from "../map/map";

// type OptionType = 'parks' | 'schools' | 'health' | null;
type FilterFormTypeProps = {
  selectedOptions: OptionType[];
  setSelectedOptions: Dispatch<SetStateAction<OptionType[]>>
};
export default function FilterForm({selectedOptions, setSelectedOptions}: FilterFormTypeProps) {
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

function onChangeAction(e: React.ChangeEvent<HTMLInputElement>, option: OptionType) {
    setSelectedOptions((prev) => {
        let newOptions = [...prev];
        if (e.target.checked) newOptions.push(option);
        else newOptions = removeItemOnce(newOptions, option);
        return newOptions;
})
}

  return (
    <form className={styles.root}>
      <h1>Choose a filter for map</h1>
      <div>
        <input
          type="checkbox"
          id="parks"
          name="parks"
          checked={selectedOptions.includes("parks")}
          onChange={(e) => onChangeAction(e, "parks")}
        />
        <label htmlFor="parks">Parks</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="schools"
          name="schools"
          checked={selectedOptions.includes("schools")}
          onChange={(e) => onChangeAction(e, "schools")}
        />
        <label htmlFor="schools">Schools</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="health"
          name="health"
          checked={selectedOptions.includes("health")}
          onChange={(e) => onChangeAction(e, "health")}
        />
        <label htmlFor="health">Health</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="eat"
          name="eat"
          checked={selectedOptions.includes("eat")}
          onChange={(e) => onChangeAction(e, "eat")}
        />
        <label htmlFor="eat">Eat</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="industrial"
          name="industrial"
          checked={selectedOptions.includes("industrial")}
          onChange={(e) => onChangeAction(e, "industrial")}
        />
        <label htmlFor="industrial">Industrial</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="kindergarten"
          name="kindergarten"
          checked={selectedOptions.includes("kindergarten")}
          onChange={(e) => onChangeAction(e, "kindergarten")}
        />
        <label htmlFor="kindergarten">Kindergarten</label>
      </div>
    </form>
  );
}
