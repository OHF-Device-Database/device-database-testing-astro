export const defineElementOnce = (
	tag: string,
	ctor: CustomElementConstructor,
): void => {
	if (!customElements.get(tag)) {
		customElements.define(tag, ctor);
	}
};
