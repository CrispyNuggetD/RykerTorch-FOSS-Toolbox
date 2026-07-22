#!/bin/sh

# timestamp_duration.sh
#
# No Python, no persistent state files, and no metadata tags.
# The human-readable clipboard text is the state.
#
# Usage:
#   ./timestamp_duration.sh
#   ./timestamp_duration.sh [UTC_OFFSET]
#   ./timestamp_duration.sh [UTC_OFFSET] "NEXT EVENT" [DURATION]
#
# Examples:
#   ./timestamp_duration.sh
#   ./timestamp_duration.sh 0
#   ./timestamp_duration.sh "Buy coffee" 10
#   ./timestamp_duration.sh 8 "Study" 1h30m
#
# A bare duration integer means minutes.

set -eu

die()
{
	printf 'Error: %s\n' "$*" >&2
	exit 1
}

show_help()
{
	printf '%s\n' \
		'Usage:' \
		'  ./timestamp_duration.sh' \
		'  ./timestamp_duration.sh [UTC_OFFSET]' \
		'  ./timestamp_duration.sh [UTC_OFFSET] "NEXT EVENT" [DURATION]' \
		'' \
		'No event title:' \
		'  First run copies a start timestamp.' \
		'  Second run copies the filename-style elapsed interval.' \
		'' \
		'Event mode:' \
		'  Reads the previous human-readable event template from the clipboard,' \
		'  moves Current event to Previous event, increments Event Number,' \
		'  calculates signed overshoot and cumulative overshoot, prints the new' \
		'  template, and copies it back to the clipboard.' \
		'' \
		'UTC_OFFSET:' \
		'  0, -1, 8, etc.' \
		"  Omit it to use the computer's configured timezone." \
		'' \
		'DURATION:' \
		'  Bare integer means minutes:' \
		'    15' \
		'' \
		'  Unit forms:' \
		'    10m' \
		'    1h30m' \
		'    1h2m3s'
}
os_name=$(uname)
timezone_arg=

clipboard_read()
{
	case "$os_name" in
		Darwin)
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
			die "unsupported system: $os_name"
			;;
	esac
}

clipboard_write()
{
	case "$os_name" in
		Darwin)
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
			die "unsupported system: $os_name"
			;;
	esac
}

copy_and_print()
{
	text=$1

	# Print first so clipboard I/O cannot hide the generated output.
	printf '\n%s\n' "$text"

	# Copy once, without a pipeline or temporary file.
	case "$os_name" in
		Darwin)
			# a-Shell's pbcopy reads stdin until EOF when called without
			# arguments. Passing the whole text as one argument avoids
			# that blocking stdin path.
			pbcopy "$text"
			;;
		Linux)
			if command -v wl-copy >/dev/null 2>&1; then
				wl-copy <<EOF
$text
EOF
			elif command -v xclip >/dev/null 2>&1; then
				xclip -selection clipboard <<EOF
$text
EOF
			else
				die "install wl-clipboard or xclip"
			fi
			;;
		*)
			die "unsupported system: $os_name"
			;;
	esac
}

decimal()
{
	value=$1
	value=$(printf '%s\n' "$value" | sed 's/^0*//')
	[ -n "$value" ] || value=0
	printf '%s\n' "$value"
}

is_timezone()
{
	printf '%s\n' "$1" |
		grep -Eq '^[+-]?[0-9]{1,2}$' || return 1

	value=${1#+}
	[ "$value" -ge -14 ] 2>/dev/null &&
	[ "$value" -le 14 ] 2>/dev/null
}

tz_value()
{
	value=${1#+}

	if [ "$value" -gt 0 ]; then
		printf 'UTC-%s\n' "$value"
	elif [ "$value" -lt 0 ]; then
		printf 'UTC+%s\n' "$((0 - value))"
	else
		printf 'UTC0\n'
	fi
}

date_now()
{
	format=$1

	if [ -z "$timezone_arg" ]; then
		date "$format"
	else
		TZ=$(tz_value "$timezone_arg") date "$format"
	fi
}

epoch_to_stamp()
{
	epoch=$1

	if [ -z "$timezone_arg" ]; then
		case "$os_name" in
			Darwin)
				date -r "$epoch" '+%Y%m%d(%a)%H%M%S%z'
				;;
			Linux)
				date -d "@$epoch" '+%Y%m%d(%a)%H%M%S%z'
				;;
		esac
	else
		tz=$(tz_value "$timezone_arg")

		case "$os_name" in
			Darwin)
				TZ="$tz" date -r "$epoch" \
					'+%Y%m%d(%a)%H%M%S%z'
				;;
			Linux)
				TZ="$tz" date -d "@$epoch" \
					'+%Y%m%d(%a)%H%M%S%z'
				;;
		esac
	fi
}

to_epoch()
{
	value=$1

	case "$os_name" in
		Darwin)
			date -j -f '%Y-%m-%d %H:%M:%S %z' \
				"$value" '+%s'
			;;
		Linux)
			date -d "$value" '+%s'
			;;
	esac
}

stamp_to_epoch()
{
	stamp=$1

	parsed=$(
		printf '%s\n' "$stamp" |
			sed -n \
			's/^\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)([^)]*)\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)\([+-][0-9]\{4\}\)$/\1-\2-\3 \4:\5:\6 \7/p'
	)

	[ -n "$parsed" ] ||
		die "invalid timestamp in clipboard: $stamp"

	to_epoch "$parsed"
}

stamp_date()
{
	printf '%s\n' "$1" |
		sed -n 's/^\([0-9]\{8\}([^)]*)\).*/\1/p'
}

stamp_ymd()
{
	printf '%s\n' "$1" |
		sed -n 's/^\([0-9]\{8\}\).*/\1/p'
}

stamp_time()
{
	printf '%s\n' "$1" |
		sed -n \
		's/^[0-9]\{8\}([^)]*)\([0-9]\{6\}\).*/\1/p'
}

stamp_zone()
{
	printf '%s\n' "$1" |
		sed -n 's/.*\([+-][0-9]\{4\}\)$/\1/p'
}

strip_title_quotes()
{
	printf '%s\n' "$1" |
		sed \
			-e 's/^"\(.*\)"$/\1/' \
			-e "s/^'\(.*\)'$/\1/" \
			-e 's/^“\(.*\)”$/\1/' \
			-e 's/^‘\(.*\)’$/\1/'
}

format_duration()
{
	total=$1
	sign=

	if [ "$total" -lt 0 ]; then
		sign=-
		total=$((0 - total))
	fi

	hours=$((total / 3600))
	minutes=$(((total % 3600) / 60))
	seconds=$((total % 60))

	if [ "$hours" -gt 0 ]; then
		printf '%s%02dH%02dM%02dS' \
			"$sign" "$hours" "$minutes" "$seconds"
	elif [ "$minutes" -gt 0 ]; then
		printf '%s%02dM%02dS' \
			"$sign" "$minutes" "$seconds"
	else
		printf '%s%02dS' "$sign" "$seconds"
	fi
}

make_filename()
{
	start_epoch=$1
	end_epoch=$2

	start_stamp=$(epoch_to_stamp "$start_epoch")
	end_stamp=$(epoch_to_stamp "$end_epoch")
	duration=$(format_duration "$((end_epoch - start_epoch))")

	start_date=$(stamp_date "$start_stamp")
	start_time=$(stamp_time "$start_stamp")
	start_zone=$(stamp_zone "$start_stamp")

	end_date=$(stamp_date "$end_stamp")
	end_time=$(stamp_time "$end_stamp")
	end_zone=$(stamp_zone "$end_stamp")

	if [ "$start_date" = "$end_date" ] &&
		[ "$start_zone" = "$end_zone" ]; then
		printf '%s_%s-%s_%s_[%s]' \
			"$start_date" "$start_time" "$end_time" \
			"$start_zone" "$duration"
	else
		printf '%s_%s_%s--%s_%s_%s_[%s]' \
			"$start_date" "$start_time" "$start_zone" \
			"$end_date" "$end_time" "$end_zone" \
			"$duration"
	fi
}

is_duration()
{
	value=$(printf '%s' "$1" | tr 'HMS' 'hms')

	case "$value" in
		''|*[!0-9hms]*)
			return 1
			;;
	esac

	if printf '%s\n' "$value" | grep -Eq '^[0-9]+$'; then
		return 0
	fi

	printf '%s\n' "$value" |
		grep -Eq '^([0-9]+h)?([0-9]+m)?([0-9]+s)?$' &&
		printf '%s\n' "$value" | grep -Eq '[hms]'
}

duration_seconds()
{
	value=$(printf '%s' "$1" | tr 'HMS' 'hms')

	# A bare integer means minutes.
	if printf '%s\n' "$value" | grep -Eq '^[0-9]+$'; then
		value=$(decimal "$value")
		printf '%s\n' "$((value * 60))"
		return
	fi

	hours=0
	minutes=0
	seconds=0

	case "$value" in
		*h*)
			hours=${value%%h*}
			value=${value#*h}
			;;
	esac

	case "$value" in
		*m*)
			minutes=${value%%m*}
			value=${value#*m}
			;;
	esac

	case "$value" in
		*s)
			seconds=${value%s}
			;;
	esac

	hours=$(decimal "$hours")
	minutes=$(decimal "$minutes")
	seconds=$(decimal "$seconds")

	printf '%s\n' \
		"$((hours * 3600 + minutes * 60 + seconds))"
}

parse_signed_duration()
{
	value=$1
	sign=1

	case "$value" in
		-*)
			sign=-1
			value=${value#-}
			;;
	esac

	seconds=$(duration_seconds "$value")
	printf '%s\n' "$((sign * seconds))"
}

is_hhmmss()
{
	value=$1

	printf '%s\n' "$value" |
		grep -Eq '^[0-9]{6}$' || return 1

	hour=$(decimal "$(printf '%s\n' "$value" |
		sed -n 's/^\([0-9][0-9]\).*/\1/p')")
	minute=$(decimal "$(printf '%s\n' "$value" |
		sed -n 's/^..\([0-9][0-9]\).*/\1/p')")
	second=$(decimal "$(printf '%s\n' "$value" |
		sed -n 's/^....\([0-9][0-9]\)$/\1/p')")

	[ "$hour" -le 23 ] &&
	[ "$minute" -le 59 ] &&
	[ "$second" -le 59 ]
}

planned_end_epoch_from_clock()
{
	start_stamp=$1
	end_clock=$2

	year=$(printf '%s\n' "$start_stamp" |
		sed -n 's/^\([0-9]\{4\}\).*/\1/p')
	month=$(printf '%s\n' "$start_stamp" |
		sed -n 's/^....\([0-9][0-9]\).*/\1/p')
	day=$(printf '%s\n' "$start_stamp" |
		sed -n 's/^......\([0-9][0-9]\).*/\1/p')
	zone=$(stamp_zone "$start_stamp")

	hour=$(printf '%s\n' "$end_clock" |
		sed -n 's/^\([0-9][0-9]\).*/\1/p')
	minute=$(printf '%s\n' "$end_clock" |
		sed -n 's/^..\([0-9][0-9]\).*/\1/p')
	second=$(printf '%s\n' "$end_clock" |
		sed -n 's/^....\([0-9][0-9]\)$/\1/p')

	end_epoch=$(to_epoch \
		"$year-$month-$day $hour:$minute:$second $zone")
	start_epoch=$(stamp_to_epoch "$start_stamp")

	if [ "$end_epoch" -lt "$start_epoch" ]; then
		end_epoch=$((end_epoch + 86400))
	fi

	printf '%s\n' "$end_epoch"
}

valid_start_stamp()
{
	printf '%s\n' "$1" |
		grep -Eq \
		'^[0-9]{8}\([[:alpha:]]{3}\)[0-9]{6}[+-][0-9]{4}$'
}

simple_timer()
{
	clip=$(clipboard_read | tr -d ':\r\n ')
	now_epoch=$(date_now '+%s')

	if valid_start_stamp "$clip"; then
		start_epoch=$(stamp_to_epoch "$clip")
		result=$(make_filename "$start_epoch" "$now_epoch")
	else
		result=$(date_now '+%Y%m%d(%a)%H%M%S%z')
	fi

	copy_and_print "$result"
}

parse_clipboard()
{
	# Stop as soon as the final required fixed-label line is found.
	clipboard_read |
		awk '
		/^Event Number: / {
			sub(/^Event Number: /, "")
			number = $0
		}
		/^Current event: / {
			sub(/^Current event: /, "")
			event = $0
		}
		/^Current event started at: / {
			sub(/^Current event started at: /, "")
			started = $0
		}
		/^Current event planned duration: / {
			sub(/^Current event planned duration: /, "")
			planned = $0
		}
		/^Cumulative overshoot today: / {
			sub(/^Cumulative overshoot today: /, "")
			cumulative = $0
		}
		/^Current event planned end time: / {
			sub(/^Current event planned end time: /, "")
			planned_end = $0

			print number
			print event
			print started
			print planned
			print planned_end
			print cumulative
			exit
		}'
}

case "${1:-}" in
	help|-h|--help)
		show_help
		exit 0
		;;
esac

if [ "$#" -eq 0 ]; then
	simple_timer
	exit 0
fi

if is_timezone "$1"; then
	timezone_arg=$1
	shift

	if [ "$#" -eq 0 ]; then
		simple_timer
		exit 0
	fi
fi

[ "$#" -ge 1 ] && [ "$#" -le 2 ] || {
	show_help
	exit 1
}

next_event=$(strip_title_quotes "$1")
next_planned=${2:-}

[ -n "$next_event" ] ||
	die "next event cannot be empty"

if [ -n "$next_planned" ] &&
	! is_duration "$next_planned"; then
	die "invalid duration: $next_planned"
fi

parsed=$(parse_clipboard)

previous_number=$(printf '%s\n' "$parsed" | sed -n '1p')
previous_event=$(strip_title_quotes \
	"$(printf '%s\n' "$parsed" | sed -n '2p')")
previous_started=$(printf '%s\n' "$parsed" | sed -n '3p')
previous_planned=$(printf '%s\n' "$parsed" | sed -n '4p')
previous_planned_end=$(printf '%s\n' "$parsed" | sed -n '5p')
prior_cumulative=$(printf '%s\n' "$parsed" | sed -n '6p')

now_epoch=$(date_now '+%s')
now_stamp=$(date_now '+%Y%m%d(%a)%H%M%S%z')
now_ymd=$(stamp_ymd "$now_stamp")

# No previous event template: create Event 1.
if [ -z "$previous_event" ] || [ -z "$previous_started" ]; then
	current_end=

	if [ -n "$next_planned" ]; then
		planned_seconds=$(duration_seconds "$next_planned")
		current_end_epoch=$((now_epoch + planned_seconds))
		current_end=$(stamp_time \
			"$(epoch_to_stamp "$current_end_epoch")")
	fi

	output=$(
		{
			printf 'Events completed: 0\n'
			printf 'Previous event: N/A\n'
			printf 'Previous event planned duration: N/A\n'
			printf 'Previous event planned end time: N/A\n'
			printf 'Previous event overshoot: N/A\n'
			printf 'Cumulative overshoot today: 00S\n'
			printf '\n=============================================================\n\n'
			printf 'Event Number: 1\n'
			printf 'Current event: %s\n' "$next_event"
			printf 'Current event started at: %s\n' "$now_stamp"
			printf 'Current event planned duration: %s\n' "$next_planned"
			printf 'Current event planned end time: %s\n' "$current_end"

			printf '\nA. Event to-do'\''s/goals:\n\n'
			printf '1. \n'
			printf '2. \n'
			printf '3. \n'

			printf '\nB. Event planning/what or how to achieve goals:\n'
			printf -- '- \n'

			printf '\nC. Event notes:\n'
			printf -- '- \n'

			printf '\nD. Event summary/reflection:\n'
			printf -- '- \n'
		}
	)

	copy_and_print "$output"
	exit 0
fi

case "$previous_number" in
	''|*[!0-9]*)
		previous_number=1
		;;
	*)
		previous_number=$(decimal "$previous_number")
		;;
esac

previous_start_epoch=$(stamp_to_epoch "$previous_started")
actual_seconds=$((now_epoch - previous_start_epoch))
actual_text=$(format_duration "$actual_seconds")
filename=$(make_filename "$previous_start_epoch" "$now_epoch")

overshoot_text=N/A
overshoot_seconds=
previous_planned_display=${previous_planned:-N/A}

# Prefer an explicit planned duration. If it is blank, use the manually
# edited planned end time.
if [ -n "$previous_planned" ] &&
	is_duration "$previous_planned"; then
	planned_seconds=$(duration_seconds "$previous_planned")
	overshoot_seconds=$((actual_seconds - planned_seconds))
	overshoot_text=$(format_duration "$overshoot_seconds")
elif [ -n "$previous_planned_end" ] &&
	is_hhmmss "$previous_planned_end"; then
	planned_end_epoch=$(
		planned_end_epoch_from_clock \
			"$previous_started" "$previous_planned_end"
	)
	planned_seconds=$((planned_end_epoch - previous_start_epoch))
	overshoot_seconds=$((now_epoch - planned_end_epoch))
	overshoot_text=$(format_duration "$overshoot_seconds")
	previous_planned_display=$(format_duration "$planned_seconds")
fi

# Reset the carried total when the prior event began on another date.
prior_ymd=$(stamp_ymd "$previous_started")
cumulative_seconds=0

if [ "$prior_ymd" = "$now_ymd" ] &&
	[ -n "$prior_cumulative" ] &&
	is_duration "${prior_cumulative#-}"; then
	cumulative_seconds=$(parse_signed_duration "$prior_cumulative")
fi

if [ -n "$overshoot_seconds" ]; then
	cumulative_seconds=$((cumulative_seconds + overshoot_seconds))
fi

cumulative_text=$(format_duration "$cumulative_seconds")
events_completed=$previous_number
current_number=$((previous_number + 1))

current_end=

if [ -n "$next_planned" ]; then
	next_seconds=$(duration_seconds "$next_planned")
	current_end_epoch=$((now_epoch + next_seconds))
	current_end=$(stamp_time \
		"$(epoch_to_stamp "$current_end_epoch")")
fi

output=$(
	{
		printf '%s\n\n' "$filename"
		printf 'Events completed: %s\n' "$events_completed"
		printf 'Previous event: %s [%s]\n' \
			"$previous_event" "$actual_text"
		printf 'Previous event planned duration: %s\n' \
			"$previous_planned_display"
		printf 'Previous event planned end time: %s\n' \
			"${previous_planned_end:-N/A}"
		printf 'Previous event overshoot: %s\n' "$overshoot_text"
		printf 'Cumulative overshoot today: %s\n' "$cumulative_text"
		printf '\n=============================================================\n\n'
		printf 'Event Number: %s\n' "$current_number"
		printf 'Current event: %s\n' "$next_event"
		printf 'Current event started at: %s\n' "$now_stamp"
		printf 'Current event planned duration: %s\n' "$next_planned"
		printf 'Current event planned end time: %s\n' "$current_end"

		printf '\nA. Event to-do'\''s/goals:\n\n'
		printf '1. \n'
		printf '2. \n'
		printf '3. \n'

		printf '\nB. Event planning/what or how to achieve goals:\n'
		printf -- '- \n'

		printf '\nC. Event notes:\n'
		printf -- '- \n'

		printf '\nD. Event summary/reflection:\n'
		printf -- '- \n'
	}
)

copy_and_print "$output"
