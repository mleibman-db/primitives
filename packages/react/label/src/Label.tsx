import * as React from 'react';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import { useId } from '@radix-ui/react-id';

import type * as Polymorphic from '@radix-ui/react-polymorphic';

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/

const NAME = 'Label';
const DEFAULT_TAG = 'span';

type LabelOwnProps = Polymorphic.Merge<
  Polymorphic.OwnProps<typeof Primitive>,
  { htmlFor?: string }
>;
type LabelPrimitive = Polymorphic.ForwardRefComponent<typeof DEFAULT_TAG, LabelOwnProps>;

type LabelContextValue = { id: string; ref: React.RefObject<HTMLSpanElement> };
const LabelContext = React.createContext<LabelContextValue | undefined>(undefined);

const Label = React.forwardRef((props, forwardedRef) => {
  const { as = DEFAULT_TAG, htmlFor, id: idProp, ...labelProps } = props;
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const ref = useComposedRefs(forwardedRef, labelRef);
  const id = useId(idProp);

  React.useEffect(() => {
    const label = labelRef.current;

    if (label) {
      const handleMouseDown = (event: MouseEvent) => {
        if (event.detail > 1) event.preventDefault();
      };

      // prevent text selection when double clicking label
      label.addEventListener('mousedown', handleMouseDown);
      return () => label.removeEventListener('mousedown', handleMouseDown);
    }
  }, [labelRef]);

  React.useEffect(() => {
    if (htmlFor) {
      const element = document.getElementById(htmlFor);
      const label = labelRef.current;

      if (label && element) {
        const removeLabelClickEventListener = addLabelClickEventListener(label, element);
        const getAriaLabel = () => element.getAttribute('aria-labelledby');
        const ariaLabelledBy = [getAriaLabel(), id].filter(Boolean).join(' ');
        element.setAttribute('aria-labelledby', ariaLabelledBy);

        return () => {
          removeLabelClickEventListener();
          /**
           * We get the latest attribute value because at the time that this cleanup fires,
           * the values from the closure may have changed.
           */
          const ariaLabelledBy = getAriaLabel()?.replace(id, '');
          if (ariaLabelledBy === '') {
            element.removeAttribute('aria-labelledby');
          } else if (ariaLabelledBy) {
            element.setAttribute('aria-labelledby', ariaLabelledBy);
          }
        };
      }
    }
  }, [id, htmlFor]);

  return (
    <LabelContext.Provider value={React.useMemo(() => ({ id, ref: labelRef }), [id])}>
      <Primitive role="label" id={id} {...labelProps} as={as} ref={ref} />
    </LabelContext.Provider>
  );
}) as LabelPrimitive;

Label.displayName = NAME;

/* -----------------------------------------------------------------------------------------------*/

const useLabelContext = (element?: HTMLElement | null) => {
  const context = React.useContext(LabelContext);

  React.useEffect(() => {
    const label = context?.ref.current;

    if (label && element) {
      return addLabelClickEventListener(label, element);
    }
  }, [context, element]);

  return context?.id;
};

function addLabelClickEventListener(label: HTMLSpanElement, control: HTMLElement) {
  const handleClick = (event: MouseEvent) => {
    const isClickingControl = control.contains(event.target as Node);
    // Ensure event was generated by a user action
    // https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted
    const isUserClick = event.isTrusted === true;
    /**
     * When a label is wrapped around the control it labels, we trigger the appropriate events
     * on the control when the label is clicked. We do nothing if the user is already clicking the
     * control inside the label.
     */
    if (!isClickingControl && isUserClick) {
      control.click();
      control.focus();
    }
  };

  label.addEventListener('click', handleClick);
  return () => label.removeEventListener('click', handleClick);
}

const Root = Label;

export {
  Label,
  //
  Root,
  //
  useLabelContext,
};
export type { LabelPrimitive };
