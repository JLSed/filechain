/** {year}{day}{month}00{4 random digits} */
export function generateApplicationNumber(): string {
	const now = new Date();
	const year = now.getFullYear();
	const day = now.getDate();
	const month = now.getMonth() + 1;
	const random = Math.floor(1000 + Math.random() * 9000);
	return `${year}${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}00${random}`;
}
