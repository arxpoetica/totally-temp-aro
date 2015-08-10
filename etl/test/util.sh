#!/bin/sh

function assert_sql_equals {
  OUTPUT=$($PSQL -c "$2" -t -P format=unaligned)
  if [ "$OUTPUT" = $3 ]; then
    echo ✓ $1
  else
    echo ✗ $1
    echo "    SQL: $2"
    echo "    Output was expected to be equal $3 and it was $OUTPUT"
    exit 1
  fi
}

function assert_sql_above {
  OUTPUT=$($PSQL -c "$2" -t -P format=unaligned)
  if [ "$OUTPUT" -gt $3 ]; then
    echo ✓ $1
  else
    echo ✗ $1
    echo "    SQL: $2"
    echo "    Output was expected to be above $3 and it was $OUTPUT"
    exit 1
  fi
}

function assert_sql_ok {
  assert_sql_equals "$1" "$2" 't'
}
