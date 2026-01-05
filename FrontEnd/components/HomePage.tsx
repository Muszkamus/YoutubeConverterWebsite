"use client";

import React, { useEffect, useReducer, useState } from "react";
import { initialState, reducer } from "../reducer/reducer";

import ConvertButton from "../components/ConvertButton";
import InputField from "../components/InputField";

const HomePage = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [link, setLink] = useState("");

  return (
    <div className="homepage">
      <InputField
        link={link}
        setLink={setLink}
        state={state}
        dispatch={dispatch}
      />
      <ConvertButton
        link={link}
        setLink={setLink}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
};

export default HomePage;
