pub mod w3;
pub use w3::entry;
use w3::*;

pub fn method(input: InputMethod) -> String {
    format!("{}{}", input.arg.prop_a, input.arg.prop_b)
}