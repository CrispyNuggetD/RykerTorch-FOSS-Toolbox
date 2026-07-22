#!/bin/sh

# timestamp_duration.sh
#
# First run:
#   Saves the current timestamp to the clipboard.
#
# Second run:
#   Reads the saved timestamp, calculates the elapsed duration, and copies
#   the completed interval to the clipboard.
#
# Usage:
#   ./timestamp_duration.sh       # computer's current local timezone
#   ./timestamp_duration.sh 0     # UTC
#   ./timestamp_duration.sh 8     # UTC+8
#   ./timestamp_duration.sh -1    # UTC-1
#
# Output examples:
#   20260722(Wed)_091258-121401_+0800_03H01M03S
#
# Across dates or timezones:
#   20260722(Wed)_091258_+0800--20260724(Fri)_101605_+0800_49H03M07S
#
# Supported systems:
#   - a-Shell / macOS (pbpaste and pbcopy)
#   - Ubuntu with wl-clipboard or xclip

set -eu

die()
{
	printf 'Error: %s\n' "$*" >&2
	exit 1
}

platform=$(uname -s)

clipboard_read()
{
	case "$platform" in
		Darwin)
			command -v pbpaste >/dev/null 2>&1 ||
				die "pbpaste is unavailable"
			pbpaste
			;;
		Linux)
			if command -v wl-paste >/dev/null 2>&1; then
				wl-paste --no-newline
			elif command -v xclip >/dev/null 2>&1; then
				xclip -selection clipboard -o
			else
				die "install wl-clipboard or xclip"
			fi
			;;
		*)
			die "unsupported system: $platform"
			;;
	esac
}

clipboard_write()
{
	case "$platform" in
		Darwin)
			command -v pbcopy >/dev/null 2>&1 ||
				die "pbcopy is unavailable"
			pbcopy
			;;
		Linux)
			if command -v wl-copy >/dev/null 2>&1; then
				wl-copy
			elif command -v xclip >/dev/null 2>&1; then
				xclip -selection clipboard
			else
				die "install wl-clipboard or xclip"
			fi
			;;
		*)
			die "unsupported system: $platform"
			;;
	esac
}

valid_timestamp()
{
	printf '%s\n' "$1" |
		grep -Eq '^[0-9]{8}\([[:alpha:]]{3}\)[0-9]{6}[+-][0-9]{4}$'
}

format_now()
{
	if [ "$#" -eq 0 ]; then
		# Use the computer's configured local timezone.
		date '+%Y%m%d(%a)%H%M%S%z'
		return
	fi

	offset=$1

	printf '%s\n' "$offset" |
		grep -Eq '^[+-]?[0-9]{1,2}$' ||
		die "timezone must be an integer from -14 to 14"

	# Remove an optional leading plus sign.
	offset=${offset#+}

	[ "$offset" -ge -14 ] 2>/dev/null &&
	[ "$offset" -le 14 ] 2>/dev/null ||
		die "timezone must be between UTC-14 and UTC+14"

	# POSIX TZ signs are reversed:
	#   UTC+8  -> TZ=UTC-8
	#   UTC-1  -> TZ=UTC+1
	if [ "$offset" -gt 0 ]; then
		tz_value="UTC-$offset"
	elif [ "$offset" -lt 0 ]; then
		absolute=$((0 - offset))
		tz_value="UTC+$absolute"
	else
		tz_value="UTC0"
	fi

	TZ="$tz_value" date '+%Y%m%d(%a)%H%M%S%z'
}

to_epoch()
{
	stamp=$1

	year=$(printf '%s' "$stamp" | cut -c1-4)
	month=$(printf '%s' "$stamp" | cut -c5-6)
	day=$(printf '%s' "$stamp" | cut -c7-8)
	hour=$(printf '%s' "$stamp" | cut -c14-15)
	minute=$(printf '%s' "$stamp" | cut -c16-17)
	second=$(printf '%s' "$stamp" | cut -c18-19)
	zone=$(printf '%s' "$stamp" | cut -c20-24)

	case "$platform" in
		Darwin)
			date -j -f '%Y-%m-%d %H:%M:%S %z' \
				"$year-$month-$day $hour:$minute:$second $zone" \
				'+%s'
			;;
		Linux)
			date -d \
				"$year-$month-$day $hour:$minute:$second $zone" \
				'+%s'
			;;
		*)
			die "unsupported system: $platform"
			;;
	esac
}

[ "$#" -le 1 ] || die "usage: $0 [UTC_OFFSET]"

if [ "$#" -eq 0 ]; then
	now=$(format_now)
else
	now=$(format_now "$1")
fi

clip=$(clipboard_read | tr -d ':\r\n ')

# First run, or clipboard contains unrelated text:
# save the current timestamp as the new starting point.
if ! valid_timestamp "$clip"; then
	printf '%s' "$now" | clipboard_write
	printf 'Start copied:\n%s\n' "$now"
	exit 0
fi

start=$clip
end=$now

start_epoch=$(to_epoch "$start")
end_epoch=$(to_epoch "$end")
elapsed=$((end_epoch - start_epoch))

[ "$elapsed" -ge 0 ] ||
	die "the stored start time is later than the current time"

duration_hours=$((elapsed / 3600))
duration_minutes=$(((elapsed % 3600) / 60))
duration_seconds=$((elapsed % 60))

duration=$(printf '%02dH%02dM%02dS' \
	"$duration_hours" \
	"$duration_minutes" \
	"$duration_seconds")

start_date=$(printf '%s' "$start" | cut -c1-13)
start_time=$(printf '%s' "$start" | cut -c14-19)
start_zone=$(printf '%s' "$start" | cut -c20-24)

end_date=$(printf '%s' "$end" | cut -c1-13)
end_time=$(printf '%s' "$end" | cut -c14-19)
end_zone=$(printf '%s' "$end" | cut -c20-24)

if [ "$start_date" = "$end_date" ] &&
	[ "$start_zone" = "$end_zone" ]; then
	result="${start_date}_${start_time}-${end_time}_${start_zone}_${duration}"
else
	result="${start_date}_${start_time}_${start_zone}--${end_date}_${end_time}_${end_zone}_${duration}"
fi

printf '%s' "$result" | clipboard_write
printf 'Completed interval copied:\n%s\n' "$result"
