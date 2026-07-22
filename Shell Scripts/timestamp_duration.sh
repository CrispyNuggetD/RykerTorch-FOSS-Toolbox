#!/bin/sh

set -eu

now=$(date '+%Y%m%d(%a)%H%M%S%z')
clip=$(pbpaste | tr -d ':\r\n ')

# A valid stored start timestamp looks like:
# 20260722(Wed)083822+0800
if ! printf '%s\n' "$clip" |
	grep -Eq '^[0-9]{8}\([^)]{3}\)[0-9]{6}[+-][0-9]{4}$'
then
	printf '%s' "$now" | pbcopy
	printf 'Start copied:\n%s\n' "$now"
	exit 0
fi

start=$clip
end=$now

start_date=$(printf '%s\n' "$start" |
	sed -n 's/^\([0-9]\{8\}([^)]*)\).*/\1/p')

start_time=$(printf '%s\n' "$start" |
	sed -n 's/^[0-9]\{8\}([^)]*)\([0-9]\{6\}\).*/\1/p')

start_zone=$(printf '%s\n' "$start" |
	sed -n 's/.*\([+-][0-9]\{4\}\)$/\1/p')

end_date=$(printf '%s\n' "$end" |
	sed -n 's/^\([0-9]\{8\}([^)]*)\).*/\1/p')

end_time=$(printf '%s\n' "$end" |
	sed -n 's/^[0-9]\{8\}([^)]*)\([0-9]\{6\}\).*/\1/p')

end_zone=$(printf '%s\n' "$end" |
	sed -n 's/.*\([+-][0-9]\{4\}\)$/\1/p')

if [ "$start_date" = "$end_date" ] &&
	[ "$start_zone" = "$end_zone" ]
then
	result="${start_date}_${start_time}-${end_time}_${start_zone}"
else
	result="${start_date}_${start_time}_${start_zone}--${end_date}_${end_time}_${end_zone}"
fi

printf '%s' "$result" | pbcopy
printf 'Completed interval copied:\n%s\n' "$result"