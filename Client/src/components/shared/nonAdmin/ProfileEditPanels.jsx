import React from "react";

import Input from "../Input";

const getFieldKey = (field, index, prefix) =>
  field.key || field.id || field.name || `${prefix}-${index}`;

const renderInput = (field, key, fallbackOnChange) => (
  <Input
    key={key}
    id={field.id}
    name={field.name}
    type={field.type || "text"}
    label={field.label}
    placeholder={field.placeholder}
    value={field.value ?? ""}
    onChange={field.onChange || fallbackOnChange}
    readOnly={Boolean(field.readOnly)}
    required={Boolean(field.required)}
    disabled={Boolean(field.disabled)}
  />
);

const renderFields = (fields, fallbackOnChange, prefix) =>
  fields.map((field, index) => {
    const key = getFieldKey(field, index, prefix);

    if (field.render) {
      return (
        <div key={key} className="manager-ui-form-custom">
          {field.render()}
        </div>
      );
    }

    if (Array.isArray(field.group) && field.group.length > 0) {
      return (
        <div key={key} className="manager-ui-form-inline">
          {field.group.map((nestedField, nestedIndex) =>
            renderInput(nestedField, getFieldKey(nestedField, nestedIndex, key), fallbackOnChange)
          )}
        </div>
      );
    }

    return renderInput(field, key, fallbackOnChange);
  });

const Panel = ({ panel, fallbackOnChange, action }) => {
  if (!panel) return null;

  return (
    <div className="manager-ui-form-panel">
      <div className="manager-ui-form-panel__header">
        <div className="manager-ui-form-panel__title-wrap">
          {panel.icon ? <span className="manager-ui-form-panel__icon">{panel.icon}</span> : null}
          <h6 className="manager-ui-form-panel__title">{panel.title}</h6>
        </div>
      </div>

      <div className="manager-ui-form-fields">{renderFields(panel.fields || [], fallbackOnChange, panel.title || "panel")}</div>

      {action ? <div className="manager-ui-form-actions">{action}</div> : null}
    </div>
  );
};

export const ProfileEditPanels = ({
  leftPanel,
  rightPanel,
  onSave,
  saveLabel = "Save Changes",
  saveDisabled = false,
  saveType = "button",
}) => (
  <div className="manager-ui-form-layout">
    <Panel
      panel={leftPanel}
      fallbackOnChange={leftPanel?.onChange}
      action={
        onSave ? (
          <button
            type={saveType}
            className="manager-ui-button manager-ui-button--primary"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saveLabel}
          </button>
        ) : null
      }
    />
    <Panel panel={rightPanel} fallbackOnChange={rightPanel?.onChange} />
  </div>
);
